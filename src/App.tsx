import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const getNextYearTarget = () => {
  const now = new Date()
  const year = now.getFullYear() + 1
  return new Date(`${year}-01-01T00:00:00`).getTime()
}
// const getNextYearTarget = () => Date.now() + 5000

const getTargetYear = (targetTime: number) => new Date(targetTime).getFullYear()

function App() {
  const forceFireworks =
    new URLSearchParams(window.location.search).get('fireworks') === '1'
  const [targetTime] = useState(() => getNextYearTarget())
  const [mode, setMode] = useState<'countdown' | 'fireworks'>(() =>
    forceFireworks || Date.now() >= targetTime ? 'fireworks' : 'countdown',
  )

  useEffect(() => {
    document.body.classList.remove('mode-countdown', 'mode-fireworks')
    document.body.classList.add(
      mode === 'countdown' ? 'mode-countdown' : 'mode-fireworks',
    )
    return () => {
      document.body.classList.remove('mode-countdown', 'mode-fireworks')
    }
  }, [mode])

  const handleComplete = useCallback(() => setMode('fireworks'), [])

  return mode === 'fireworks' ? (
    <FireworksView />
  ) : (
    <CountdownView targetTime={targetTime} onComplete={handleComplete} />
  )
}

export default App

type CountdownProps = {
  targetTime: number
  onComplete: () => void
}

function CountdownView({ targetTime, onComplete }: CountdownProps) {
  const targetYear = getTargetYear(targetTime)
  const [title, setTitle] = useState('秃子喵提醒你，距离新年还有')
  const [values, setValues] = useState({
    day: '--',
    hour: '--',
    minute: '--',
    second: '--',
  })
  const [bgIndex, setBgIndex] = useState(1)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now()
      const gap = targetTime - now

      if (gap <= 0) {
        if (!completedRef.current) {
          completedRef.current = true
          setTitle('Happy New Year')
          setValues({
            day: '新',
            hour: '年',
            minute: '快',
            second: '乐',
          })
          window.setTimeout(onComplete, 800)
        }
        return
      }

      const second = 1000
      const minute = second * 60
      const hour = minute * 60
      const day = hour * 24

      const d = Math.floor(gap / day)
      const h = Math.floor((gap % day) / hour)
      const m = Math.floor((gap % hour) / minute)
      const s = Math.floor((gap % minute) / second)

      setValues({
        day: String(d),
        hour: String(h),
        minute: String(m),
        second: String(s),
      })
    }

    updateCountdown()
    const timer = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(timer)
  }, [onComplete, targetTime])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBgIndex((prev) => (prev >= 4 ? 1 : prev + 1))
    }, 2000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    let width = 0
    let height = 0
    let animationId = 0
    let flakes: Snowflake[] = []

    class Snowflake {
      x = 0
      y = 0
      vx = 0
      vy = 0
      radius = 0
      alpha = 0

      reset() {
        this.x = Math.random() * width
        this.y = -Math.random() * height
        this.vx = -3 + Math.random() * 6
        this.vy = 2 + Math.random() * 3
        this.radius = 1 + Math.random() * 3
        this.alpha = 0.1 + Math.random() * 0.8
      }
    }

    const createFlakes = () => {
      const count = Math.max(60, Math.floor(width / 4))
      flakes = Array.from({ length: count }, () => {
        const flake = new Snowflake()
        flake.reset()
        return flake
      })
    }

    const onResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
      createFlakes()
    }

    const update = () => {
      ctx.clearRect(0, 0, width, height)
      for (const flake of flakes) {
        flake.x += flake.vx
        flake.y += flake.vy
        if (flake.y - flake.radius > height) {
          flake.reset()
          flake.y = -flake.radius
        }
        ctx.save()
        ctx.beginPath()
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = flake.alpha
        ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
      animationId = window.requestAnimationFrame(update)
    }

    onResize()
    window.addEventListener('resize', onResize)
    update()

    return () => {
      window.cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return (
    <div
      className="countdown-root"
      style={{ backgroundImage: `url(/tu${bgIndex}.png)` }}
    >
      <canvas className="snow-canvas" ref={canvasRef} />
      <div className="container">
        <h2>
          <span>{title}</span>
          {targetYear}
        </h2>
        <div className="countdown">
          <div>{values.day}</div>
          <div>{values.hour}</div>
          <div>{values.minute}</div>
          <div>{values.second}</div>
        </div>
      </div>
    </div>
  )
}

function FireworksView() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    const win = window as typeof window & { __fireworksScriptsLoaded?: boolean }
    if (win.__fireworksScriptsLoaded) {
      return
    }
    win.__fireworksScriptsLoaded = true

    const loadScript = (src: string) =>
      new Promise<void>((resolve, reject) => {
        const existing = document.querySelector(
          `script[data-fireworks-src="${src}"]`,
        )
        if (existing) {
          resolve()
          return
        }
        const script = document.createElement('script')
        script.src = src
        script.async = false
        script.dataset.fireworksSrc = src
        script.onload = () => resolve()
        script.onerror = () => reject(new Error(`Failed to load ${src}`))
        document.body.appendChild(script)
      })

    const loadAll = async () => {
      await loadScript('/fireworks/fscreen@1.0.1.js')
      await loadScript('/fireworks/Stage@0.1.4.js')
      await loadScript('/fireworks/MyMath.js')
      await loadScript('/fireworks/firework.js')
    }

    loadAll()
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }
    audio.volume = 0.5
    const timer = window.setInterval(() => {
      if (audio.paused) {
        audio.play().catch(() => {})
      } else {
        window.clearInterval(timer)
      }
    }, 200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="firework-root">
      <audio ref={audioRef} loop playsInline>
        <source src="/2923451160.mp3" />
      </audio>
      <div className="container">
        <div className="loading-init">
          <div className="loading-init__header">Loading</div>
          <div className="loading-init__status">Assembling Shells</div>
        </div>
        <div className="stage-container remove">
          <div className="canvas-container">
            <canvas id="trails-canvas"></canvas>
            <canvas id="main-canvas"></canvas>
          </div>
          <div className="controls">
            <div className="btn pause-btn">
              <svg fill="white" width="24" height="24">
                <use href="#icon-pause" xlinkHref="#icon-pause"></use>
              </svg>
            </div>
            <div className="btn sound-btn">
              <svg fill="white" width="24" height="24">
                <use href="#icon-sound-off" xlinkHref="#icon-sound-off"></use>
              </svg>
            </div>
            <div className="btn settings-btn">
              <svg fill="white" width="24" height="24">
                <use href="#icon-settings" xlinkHref="#icon-settings"></use>
              </svg>
            </div>
          </div>
          <div className="menu hide">
            <div className="menu__inner-wrap">
              <div className="btn btn--bright close-menu-btn">
                <svg fill="white" width="24" height="24">
                  <use href="#icon-close" xlinkHref="#icon-close"></use>
                </svg>
              </div>
              <div className="menu__header">Settings</div>
              <div className="menu__subheader">For more info, click any label.</div>
              <form>
                <div className="form-option form-option--select">
                  <label className="shell-type-label">Shell Type</label>
                  <select className="shell-type"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="shell-size-label">Shell Size</label>
                  <select className="shell-size"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="quality-ui-label">Quality</label>
                  <select className="quality-ui"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="sky-lighting-label">Sky Lighting</label>
                  <select className="sky-lighting"></select>
                </div>
                <div className="form-option form-option--select">
                  <label className="scaleFactor-label">Scale</label>
                  <select className="scaleFactor"></select>
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="auto-launch-label">Auto Fire</label>
                  <input className="auto-launch" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox form-option--finale-mode">
                  <label className="finale-mode-label">Finale Mode</label>
                  <input className="finale-mode" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="hide-controls-label">Hide Controls</label>
                  <input className="hide-controls" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox form-option--fullscreen">
                  <label className="fullscreen-label">Fullscreen</label>
                  <input className="fullscreen" type="checkbox" />
                </div>
                <div className="form-option form-option--checkbox">
                  <label className="long-exposure-label">Open Shutter</label>
                  <input className="long-exposure" type="checkbox" />
                </div>
              </form>
              <div className="credits">
                Passionately built by{' '}
                <a href="https://cmiller.tech/" target="_blank" rel="noreferrer">
                  Caleb Miller
                </a>
                .
              </div>
            </div>
          </div>
        </div>
        <div className="help-modal">
          <div className="help-modal__overlay"></div>
          <div className="help-modal__dialog">
            <div className="help-modal__header"></div>
            <div className="help-modal__body"></div>
            <button type="button" className="help-modal__close-btn">
              Close
            </button>
          </div>
        </div>
      </div>

      <svg
        style={{ height: 0, width: 0, position: 'absolute', visibility: 'hidden' }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <symbol id="icon-play" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </symbol>
        <symbol id="icon-pause" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </symbol>
        <symbol id="icon-close" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
        </symbol>
        <symbol id="icon-settings" viewBox="0 0 24 24">
          <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
        </symbol>
        <symbol id="icon-sound-on" viewBox="0 0 24 24">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </symbol>
        <symbol id="icon-sound-off" viewBox="0 0 24 24">
          <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
        </symbol>
      </svg>
    </div>
  )
}
