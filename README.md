    
    
    const { voices, record, paused, pauseResume, cancel, speaking, changeRate } = useSpeak()
    record('你好！', 'Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)', 1, msg => {
      console.log(msg)
    })
