import React, { useState, useEffect, useRef } from 'react';
export default function useSpeak() {
    const [voices, setVoices] = useState([])
    const [speaking, setSpeaking] = useState()
    const [paused, setPaused] = useState()
    const ssuRef = useRef()
    const speak = (text, voiceURI, rate, fn = () => { }) => {
        speechSynthesis.cancel()
        const voice = voices.find(voice => voice.voiceURI === voiceURI)
        const ssu = new SpeechSynthesisUtterance(text)
        ssu.lang = 'zh-CN'
        ssu.voice = voice
        ssu.rate = rate
        ssu.onstart = () => {
            console.log('start')
            setSpeaking(true)
            fn({ start: true })
        }
        ssu.onend = () => {
            console.log('end')
            setSpeaking(false)
            fn({ end: true })
        }
        ssu.onpause = e => {
            console.log('pause')
            fn({ pause: true })
        }
        ssu.onresume = e => {
            console.log('resume')
            fn({ resume: true })
        }
        ssu.onboundary = e => {
            console.log(e)
            console.log(e.name + ' boundary reached after ' + e.elapsedTime + ' seconds.');
        }
        ssu.onerror = e => {
            console.log(e.error)
            fn({ error: true })
        }
        speechSynthesis.speak(ssu)
        console.log(voiceURI)
        console.log(text)
        ssuRef.current = ssu
    }
    const pauseResume = () => {
        if (paused) {
            speechSynthesis.resume()
            setPaused(false)
        } else {
            speechSynthesis.pause()
            setPaused(true)
        }
    }
    const cancel = () => {
        speechSynthesis.cancel()
    }
    const changeRate = (rate) => {
        if (ssuRef.current) ssuRef.current.rate = rate//无效
    }
    useEffect(() => {
        const voicesChanged = () => {
            const voices = speechSynthesis.getVoices()
            setVoices(voices)
        };
        speechSynthesis.addEventListener('voiceschanged', voicesChanged);
        voicesChanged();
        return () => {
            speechSynthesis.removeEventListener('voiceschanged', voicesChanged);
        }
    }, [])

    const record = (text, voiceURI, rate, fn = () => { }) => {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm; codecs=opus") ? "audio/webm; codecs=opus" : "audio/ogg; codecs=opus"
        const mediaStream = new MediaStream()
        const mediaRecorder = new MediaRecorder(mediaStream, {
            mimeType,
            bitsPerSecond: 256 * 8 * 1024
        })
        const chunks = Array()
        navigator.mediaDevices.getUserMedia({
            audio: true
        })
            .then(stream => {
                const track = stream.getAudioTracks()[0]
                mediaStream.addTrack(track)
                mediaRecorder.ondataavailable = event => {
                    if (event.data.size > 0) {
                        chunks.push(event.data)
                    };
                };
                mediaRecorder.onstop = () => {
                    track.stop();
                    mediaStream.getAudioTracks()[0].stop()
                    mediaStream.removeTrack(track)
                    if (!chunks.length) throw new Error("no data to return")
                    const data = new Blob(chunks, {
                        type: 'audio/mp4'
                    })
                    const url = URL.createObjectURL(data)
                    fn({ url })
                }
                mediaRecorder.start()
                speak(text, voiceURI, rate, msg => {
                    if (msg.end) {
                        mediaRecorder.stop()
                    } else if (msg.pause) {
                        mediaRecorder.pause()
                    } else if (msg.resume) {
                        mediaRecorder.resume()
                    }
                    fn(msg)
                });
            })
    }
    return { voices, speak, record, pauseResume, paused, speaking, cancel, changeRate }
}
