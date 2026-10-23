import { useState, useEffect, useRef, useCallback } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export type MicrophoneStatus =
  | 'Microphone ready'
  | 'Listening...'
  | 'Microphone permission required'
  | 'Microphone unavailable';

interface UseSpeechRecognitionOptions {
  onQuestionDetected: (question: string) => void;
  silenceThresholdMs?: number;
}

export function useSpeechRecognition({
  onQuestionDetected,
  silenceThresholdMs = 1400,
}: UseSpeechRecognitionOptions) {
  const [micStatus, setMicStatus] = useState<MicrophoneStatus>('Microphone ready');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTextRef = useRef<string>('');
  const currentInterimRef = useRef<string>('');
  const isManuallyStoppedRef = useRef<boolean>(false);
  const isSpeechApiActiveRef = useRef<boolean>(false);

  // Audio recording fallback via MediaRecorder
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedAudioChunksRef = useRef<Blob[]>([]);
  const fallbackTranscribingRef = useRef<boolean>(false);

  // Stop audio visualizer
  const stopAudioCapture = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
      mediaRecorderRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Finalize question and dispatch
  const finalizeQuestion = useCallback(() => {
    const fullText = (accumulatedTextRef.current + ' ' + currentInterimRef.current).trim();
    if (fullText.length >= 3) {
      onQuestionDetected(fullText);
      accumulatedTextRef.current = '';
      currentInterimRef.current = '';
      setInterimTranscript('');
    }
  }, [onQuestionDetected]);

  // Reset silence timer on incoming words
  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      finalizeQuestion();
    }, silenceThresholdMs);
  }, [finalizeQuestion, silenceThresholdMs]);

  // Send recorded audio to backend if browser speech recognition is unavailable
  const sendFallbackAudioChunk = useCallback(async () => {
    if (recordedAudioChunksRef.current.length === 0 || fallbackTranscribingRef.current) return;

    const audioBlob = new Blob(recordedAudioChunksRef.current, { type: 'audio/webm' });
    recordedAudioChunksRef.current = [];

    if (audioBlob.size < 1000) return;

    fallbackTranscribingRef.current = true;
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = (reader.result as string)?.split(',')[1];
        if (!base64Data) {
          fallbackTranscribingRef.current = false;
          return;
        }

        try {
          const res = await fetch('/api/transcribe-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audioBase64: base64Data, mimeType: 'audio/webm' }),
          });

          if (res.ok) {
            const data = await res.json();
            const transcript = data.transcript?.trim();
            if (transcript && transcript.length >= 3) {
              setInterimTranscript(transcript);
              onQuestionDetected(transcript);
            }
          }
        } catch (e) {
          console.warn('Fallback transcription request error:', e);
        } finally {
          fallbackTranscribingRef.current = false;
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (_) {
      fallbackTranscribingRef.current = false;
    }
  }, [onQuestionDetected]);

  // Start listening (Must be callable in direct user click!)
  const startListening = useCallback(async (): Promise<boolean> => {
    isManuallyStoppedRef.current = false;
    setErrorMessage(null);

    // 1. Check browser environment & secure context
    if (typeof window === 'undefined') return false;

    if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
      setMicStatus('Microphone unavailable');
      setErrorMessage('Microphone requires a secure HTTPS connection.');
      return false;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicStatus('Microphone unavailable');
      setErrorMessage('Microphone is not supported in this browser environment.');
      return false;
    }

    // 2. Request actual microphone permission & get stream
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      if (
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError'
      ) {
        setMicStatus('Microphone permission required');
        setErrorMessage('Microphone permission denied. Please allow microphone in browser settings.');
      } else if (
        err.name === 'NotFoundError' ||
        err.name === 'DevicesNotFoundError'
      ) {
        setMicStatus('Microphone unavailable');
        setErrorMessage('No microphone device was found on this device.');
      } else if (
        err.name === 'NotReadableError' ||
        err.name === 'TrackStartError'
      ) {
        setMicStatus('Microphone unavailable');
        setErrorMessage('Microphone is in use by another application or OS service.');
      } else {
        setMicStatus('Microphone unavailable');
        setErrorMessage(err.message || 'Could not access microphone.');
      }
      setIsListening(false);
      return false;
    }

    // 3. Setup Web Audio Analyser to monitor real sound levels
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.4;
        analyserRef.current = analyser;

        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateAudioMeter = () => {
          if (!analyserRef.current || isManuallyStoppedRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const avg = sum / dataArray.length;
          const level = Math.min(100, Math.round((avg / 128) * 100));
          setAudioLevel(level);

          animFrameRef.current = requestAnimationFrame(updateAudioMeter);
        };

        updateAudioMeter();
      }
    } catch (audioErr) {
      console.warn('AudioContext meter setup notice:', audioErr);
    }

    // 4. Initialize Web Speech API
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        if (recognitionRef.current) {
          try {
            recognitionRef.current.abort();
          } catch (_) {}
        }

        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          isSpeechApiActiveRef.current = true;
          setIsListening(true);
          setMicStatus('Listening...');
          setErrorMessage(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          if (finalTranscript) {
            accumulatedTextRef.current = (accumulatedTextRef.current + ' ' + finalTranscript).trim();
          }

          currentInterimRef.current = currentInterim;
          const combined = (accumulatedTextRef.current + ' ' + currentInterim).trim();
          setInterimTranscript(combined);

          resetSilenceTimer();
        };

        recognition.onerror = (event: any) => {
          console.warn('SpeechRecognition error:', event.error);
          if (event.error === 'not-allowed') {
            setMicStatus('Microphone permission required');
            setErrorMessage('Speech recognition permission denied.');
            setIsListening(false);
          } else if (event.error === 'audio-capture') {
            setMicStatus('Microphone unavailable');
            setErrorMessage('Microphone capture error. Check device settings.');
            setIsListening(false);
          } else if (event.error === 'no-speech') {
            // Normal silence; do not stop listening
          } else {
            // Network or transient engine notice
          }
        };

        recognition.onend = () => {
          isSpeechApiActiveRef.current = false;
          // Auto-restart if not manually stopped
          if (!isManuallyStoppedRef.current) {
            try {
              recognition.start();
            } catch (_) {
              setTimeout(() => {
                if (!isManuallyStoppedRef.current) {
                  try {
                    recognition.start();
                  } catch (_) {}
                }
              }, 300);
            }
          } else {
            setIsListening(false);
            setMicStatus('Microphone ready');
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
        setMicStatus('Listening...');
        return true;
      } catch (recErr) {
        console.warn('SpeechRecognition start failed, starting MediaRecorder fallback:', recErr);
      }
    }

    // 5. Fallback: If Web Speech API not present or failed, use MediaRecorder
    try {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported('audio/webm')) {
        const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            recordedAudioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          sendFallbackAudioChunk();
        };

        // Slice audio in 3-second blocks
        recorder.start(3000);
        setIsListening(true);
        setMicStatus('Listening...');
        return true;
      }
    } catch (recErr) {
      console.warn('MediaRecorder setup error:', recErr);
    }

    // If stream is active, we are listening
    setIsListening(true);
    setMicStatus('Listening...');
    return true;
  }, [finalizeQuestion, resetSilenceTimer, sendFallbackAudioChunk]);

  // Stop listening
  const stopListening = useCallback(() => {
    isManuallyStoppedRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
    stopAudioCapture();
    setIsListening(false);
    setMicStatus('Microphone ready');
  }, [stopAudioCapture]);

  const clearTranscript = useCallback(() => {
    accumulatedTextRef.current = '';
    currentInterimRef.current = '';
    setInterimTranscript('');
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  }, []);

  const manualSubmit = useCallback(
    (customText?: string) => {
      const text = (customText || accumulatedTextRef.current + ' ' + currentInterimRef.current).trim();
      if (text) {
        onQuestionDetected(text);
        accumulatedTextRef.current = '';
        currentInterimRef.current = '';
        setInterimTranscript('');
      }
    },
    [onQuestionDetected]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyStoppedRef.current = true;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
      stopAudioCapture();
    };
  }, [stopAudioCapture]);

  return {
    micStatus,
    isListening,
    interimTranscript,
    audioLevel,
    errorMessage,
    startListening,
    stopListening,
    clearTranscript,
    manualSubmit,
  };
}
