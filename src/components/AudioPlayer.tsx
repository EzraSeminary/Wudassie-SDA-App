import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { WebView } from 'react-native-webview';
import { PauseIcon, PlayIcon, XMarkIcon, ArrowTopRightOnSquareIcon } from 'react-native-heroicons/outline';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import tw from '../../tailwind';
import { getDefaultFontStyle } from '../utils/platformUtils';

interface AudioPlayerProps {
  visible: boolean;
  onClose: () => void;
  audioUrl: string;
  title?: string;
}

const MIDI_PLAYER_CDN_URL = 'https://cdn.jsdelivr.net/combine/npm/tone@14.7.58/build/Tone.js,npm/@magenta/music@1.23.1/es6/core.js,npm/html-midi-player@1.6.0';
const HIDDEN_WEBVIEW_STYLE = {
  position: 'absolute',
  top: -1000,
  left: -1000,
  width: 1,
  height: 1,
  opacity: 0.01,
} as const;

const formatTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const mins = Math.floor(safeSeconds / 60);
  const secs = Math.floor(safeSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const buildMidiPlayerHtml = () => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
    />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: transparent;
        overflow: hidden;
      }

      midi-player {
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
      }
    </style>
    <script src="${MIDI_PLAYER_CDN_URL}"></script>
  </head>
  <body>
    <midi-player id="player" sound-font></midi-player>
    <script>
      (function () {
        const player = document.getElementById('player');
        let progressTimer = null;

        function send(payload) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(payload));
          }
        }

        function syncProgress() {
          send({
            type: 'progress',
            currentTime: Number(player.currentTime || 0),
            duration: Number(player.duration || 0),
            isPlaying: Boolean(player.playing),
          });
        }

        function startTimer() {
          if (progressTimer !== null) {
            return;
          }
          progressTimer = window.setInterval(syncProgress, 250);
        }

        function stopTimer() {
          if (progressTimer !== null) {
            window.clearInterval(progressTimer);
            progressTimer = null;
          }
        }

        const originalSetLoaded = player.setLoaded.bind(player);
        player.setLoaded = function () {
          originalSetLoaded();
          send({
            type: 'loaded',
            duration: Number(player.duration || 0),
          });
          syncProgress();
        };

        const originalSetError = player.setError.bind(player);
        player.setError = function (error) {
          originalSetError(error);
          send({
            type: 'error',
            message: String(error),
          });
        };

        player.addEventListener('start', function () {
          send({ type: 'playback', isPlaying: true });
          startTimer();
          syncProgress();
        });

        player.addEventListener('stop', function (event) {
          stopTimer();
          send({
            type: 'playback',
            isPlaying: false,
            finished: Boolean(event && event.detail && event.detail.finished),
          });
          syncProgress();
        });

        function handleMessage(event) {
          try {
            const payload = JSON.parse(event.data || '{}');

            if (payload.type === 'load' && payload.src) {
              stopTimer();
              player.stop();
              player.currentTime = 0;
              player.src = payload.src;
              return;
            }

            if (payload.type === 'togglePlayback') {
              Tone.start().then(function () {
                if (player.playing) {
                  player.stop();
                } else {
                  player.start();
                }
              }).catch(function (error) {
                send({ type: 'error', message: String(error) });
              });
              return;
            }

            if (payload.type === 'seek') {
              const nextTime = Number(payload.time || 0);
              player.currentTime = nextTime;
              syncProgress();
              return;
            }

            if (payload.type === 'stop') {
              stopTimer();
              player.stop();
              syncProgress();
            }
          } catch (error) {
            send({ type: 'error', message: String(error) });
          }
        }

        window.addEventListener('message', handleMessage);
        document.addEventListener('message', handleMessage);

        window.addEventListener('load', function () {
          send({ type: 'engine-ready' });
        });
      })();
    </script>
  </body>
</html>`;

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  visible,
  onClose,
  audioUrl,
  title,
}) => {
  const isDarkMode = useSelector((state: RootState) => state.theme.isDarkMode);
  const webViewRef = useRef<WebView>(null);
  const [engineReady, setEngineReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isMidiSource = useMemo(
    () => /\.midi?(?:$|[?#])/i.test(audioUrl),
    [audioUrl],
  );

  const midiPlayerHtml = useMemo(() => buildMidiPlayerHtml(), []);

  const postToMidiEngine = useCallback((payload: Record<string, unknown>) => {
    webViewRef.current?.postMessage(JSON.stringify(payload));
  }, []);

  useEffect(() => {
    if (!visible) {
      setEngineReady(false);
      setIsLoaded(false);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setSliderValue(0);
      setIsDragging(false);
      setErrorMessage(null);
      return;
    }

    setIsLoaded(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setSliderValue(0);
    setIsDragging(false);
    setErrorMessage(null);
  }, [visible, audioUrl]);

  useEffect(() => {
    if (!visible || !isMidiSource || !engineReady) {
      return;
    }

    postToMidiEngine({ type: 'load', src: audioUrl });
  }, [audioUrl, engineReady, isMidiSource, postToMidiEngine, visible]);

  const handleClose = () => {
    if (isMidiSource) {
      postToMidiEngine({ type: 'stop' });
    }
    onClose();
  };

  const handleOpenExternal = async () => {
    try {
      const supported = await Linking.canOpenURL(audioUrl);
      if (supported) {
        await Linking.openURL(audioUrl);
      } else {
        Alert.alert('Error', 'Cannot open this media URL');
      }
    } catch (error) {
      console.error('Error opening media URL:', error);
      Alert.alert('Error', 'Failed to open media');
    }
  };

  const handleWebViewMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);

      if (payload.type === 'engine-ready') {
        setEngineReady(true);
        return;
      }

      if (payload.type === 'loaded') {
        setIsLoaded(true);
        setDuration(Number(payload.duration || 0));
        setErrorMessage(null);
        return;
      }

      if (payload.type === 'progress') {
        const nextCurrentTime = Number(payload.currentTime || 0);
        const nextDuration = Number(payload.duration || 0);
        setIsPlaying(Boolean(payload.isPlaying));
        setCurrentTime(nextCurrentTime);
        setDuration(nextDuration);
        if (!isDragging) {
          setSliderValue(nextCurrentTime);
        }
        return;
      }

      if (payload.type === 'playback') {
        setIsPlaying(Boolean(payload.isPlaying));
        if (!payload.isPlaying && payload.finished) {
          setSliderValue(Number(duration || 0));
          setCurrentTime(Number(duration || 0));
        }
        return;
      }

      if (payload.type === 'error') {
        setErrorMessage(String(payload.message || 'Failed to load MIDI file'));
      }
    } catch (error) {
      console.error('Error parsing MIDI player message:', error);
    }
  };

  const handleTogglePlayback = () => {
    if (!isLoaded) {
      return;
    }
    postToMidiEngine({ type: 'togglePlayback' });
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  const handleSeekComplete = (value: number) => {
    const nextValue = Math.max(0, Math.min(duration || 0, value));
    setIsDragging(false);
    setSliderValue(nextValue);
    setCurrentTime(nextValue);
    postToMidiEngine({ type: 'seek', time: nextValue });
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={tw`flex-1 justify-end bg-black/50`}>
        <View
          style={tw`rounded-t-3xl ${isDarkMode ? 'bg-dark-primary-8' : 'bg-primary-1'}`}
        >
          <View style={tw`flex-row items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-dark-primary-6' : 'border-primary-6'}`}>
            <View style={tw`flex-1`}>
              {title ? (
                <Text
                  style={[
                    tw`text-lg font-nokia-bold ${isDarkMode ? 'text-dark-secondary-1' : 'text-secondary-10'}`,
                    getDefaultFontStyle('bold'),
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
              ) : null}
              <Text
                style={[
                  tw`text-sm mt-1 ${isDarkMode ? 'text-dark-secondary-3' : 'text-secondary-8'}`,
                  getDefaultFontStyle('regular'),
                ]}
              >
                {isMidiSource ? 'MIDI Player' : 'External Media'}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={tw`p-2`}>
              <XMarkIcon
                size={24}
                color={isDarkMode ? '#FDFDFD' : '#1A2024'}
              />
            </TouchableOpacity>
          </View>

          {isMidiSource ? (
            <View style={tw`p-5`}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: midiPlayerHtml, baseUrl: 'https://cdn.jsdelivr.net/' }}
                onMessage={handleWebViewMessage}
                javaScriptEnabled
                domStorageEnabled
                mediaPlaybackRequiresUserAction={false}
                mixedContentMode="always"
                allowsInlineMediaPlayback
                thirdPartyCookiesEnabled
                androidLayerType={Platform.OS === 'android' ? 'hardware' : 'none'}
                style={HIDDEN_WEBVIEW_STYLE}
              />

              <View style={tw`items-center py-4`}>
                <TouchableOpacity
                  onPress={handleTogglePlayback}
                  disabled={!isLoaded}
                  style={[
                    tw`w-20 h-20 rounded-full items-center justify-center mb-6`,
                    isLoaded ? tw`bg-accent-6` : tw`${isDarkMode ? 'bg-dark-primary-6' : 'bg-primary-5'}`,
                  ]}
                >
                  {isPlaying ? (
                    <PauseIcon size={34} color="#FFFFFF" />
                  ) : (
                    <PlayIcon size={34} color="#FFFFFF" />
                  )}
                </TouchableOpacity>

                <Text
                  style={[
                    tw`mb-2 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`,
                    getDefaultFontStyle('regular'),
                  ]}
                >
                  {errorMessage
                    ? errorMessage
                    : (isLoaded ? 'Use the slider to seek through the MIDI file' : 'Loading MIDI file...')}
                </Text>

                <View style={tw`w-full mt-2`}>
                  <Slider
                    style={tw`w-full h-10`}
                    minimumValue={0}
                    maximumValue={Math.max(duration, 1)}
                    value={isDragging ? sliderValue : currentTime}
                    minimumTrackTintColor="#EA9215"
                    maximumTrackTintColor={isDarkMode ? '#3A4750' : '#D5D9E0'}
                    thumbTintColor="#EA9215"
                    disabled={!isLoaded}
                    onSlidingStart={handleSeekStart}
                    onValueChange={setSliderValue}
                    onSlidingComplete={handleSeekComplete}
                  />

                  <View style={tw`flex-row justify-between mt-1`}>
                    <Text
                      style={[
                        tw`text-sm ${isDarkMode ? 'text-dark-secondary-3' : 'text-secondary-8'}`,
                        getDefaultFontStyle('regular'),
                      ]}
                    >
                      {formatTime(isDragging ? sliderValue : currentTime)}
                    </Text>
                    <Text
                      style={[
                        tw`text-sm ${isDarkMode ? 'text-dark-secondary-3' : 'text-secondary-8'}`,
                        getDefaultFontStyle('regular'),
                      ]}
                    >
                      {formatTime(duration)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <View style={tw`p-5 items-center`}>
              <View style={tw`py-8 items-center`}>
                <Text
                  style={[
                    tw`text-center mb-4 ${isDarkMode ? 'text-dark-secondary-2' : 'text-secondary-9'}`,
                    getDefaultFontStyle('regular'),
                  ]}
                >
                  This source is not a MIDI file. Open it in your device player.
                </Text>

                <TouchableOpacity
                  onPress={handleOpenExternal}
                  style={tw`flex-row items-center px-6 py-3 bg-accent-6 rounded-lg`}
                >
                  <ArrowTopRightOnSquareIcon size={20} color="#FFFFFF" />
                  <Text
                    style={[
                      tw`text-white font-nokia-bold ml-2`,
                      getDefaultFontStyle('bold'),
                    ]}
                  >
                    Open Media
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AudioPlayer;
