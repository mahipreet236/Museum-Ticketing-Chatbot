import { useEffect, useMemo, useRef, useState } from 'react'
import museumHero from './assests/image.png'
import galleryOne from './assests/image copy.png'
import galleryTwo from './assests/image copy 2.png'
import galleryThree from './assests/image copy 3.png'
import galleryFour from './assests/image copy 4.png'
import galleryFive from './assests/image copy 5.png'

function App() {
  const chatbotSectionRef = useRef(null)
  const chatWindowRef = useRef(null)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: 'Welcome to the museum assistant. Ask me about timings, tickets, exhibits, or bookings.',
    },
  ])
  const [isSending, setIsSending] = useState(false)
  const [isPaying, setIsPaying] = useState(false)
  const [isBooking, setIsBooking] = useState(false)
  const [showChatbot, setShowChatbot] = useState(false)
  const [bookingSession, setBookingSession] = useState(null)
  const [currentBookingStep, setCurrentBookingStep] = useState(null)
  const [bookingData, setBookingData] = useState({})

  const museumStats = [
    { value: '10 AM - 7 PM', label: 'Daily visiting hours' },
    { value: '200+', label: 'Exhibits and artifacts' },
    { value: '4.8/5', label: 'Visitor satisfaction' },
  ]

  const museumHighlights = [
    {
      title: 'Curated exhibits',
      description: 'Explore rotating galleries that highlight history, art, and immersive storytelling.',
    },
    {
      title: 'Family friendly',
      description: 'A relaxed museum experience with guided help for school groups and families.',
    },
    {
      title: 'Easy booking',
      description: 'Use the chatbot to check prices, ask questions, and book your visit in minutes.',
    },
  ]

  const visitCards = [
    {
      title: 'Plan your visit',
      detail: 'Open daily with clear signage, helpful staff, and ticket support at the entrance.',
      prompt: 'What are the museum timings?',
    },
    {
      title: 'Ticket guidance',
      detail: 'Ask the assistant about adult, student, senior, and children pricing before booking.',
      prompt: 'Tell me the ticket prices',
    },
    {
      title: 'Accessibility',
      detail: 'The museum experience is designed for a broad audience, including accessible routes and support.',
      prompt: 'What accessibility features are available?',
    },
  ]

  useEffect(() => {
    if (!showChatbot) return undefined

    const timer = window.setTimeout(() => {
      chatbotSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)

    return () => window.clearTimeout(timer)
  }, [showChatbot])

  useEffect(() => {
    const chatWindow = chatWindowRef.current
    if (!chatWindow) return

    chatWindow.scrollTop = chatWindow.scrollHeight
  }, [messages, showChatbot])

  const apiUrl = useMemo(() => {
    const endpointPath = '/bot/v1/message'
    const customBase = import.meta.env.VITE_API_BASE_URL?.trim()
    if (customBase) {
      if (customBase.includes('/bot/v1/message')) return customBase
      return `${customBase.replace(/\/$/, '')}${endpointPath}`
    }
    return endpointPath
  }, [])

  const bookingBaseUrl = useMemo(() => {
    const endpointPath = '/bot/v1/booking'
    const customBase = import.meta.env.VITE_API_BASE_URL?.trim()
    if (customBase) {
      if (customBase.includes('/bot/v1')) {
        return `${customBase.replace(/\/message$/, '')}/booking`
      }
      return `${customBase.replace(/\/$/, '')}${endpointPath}`
    }
    return endpointPath
  }, [])

  const paymentBaseUrl = useMemo(() => {
    const endpointPath = '/bot/v1/payment'
    const customBase = import.meta.env.VITE_API_BASE_URL?.trim()
    if (customBase) {
      if (customBase.includes('/bot/v1')) {
        return `${customBase.replace(/\/message$/, '')}/payment`
      }
      return `${customBase.replace(/\/$/, '')}${endpointPath}`
    }
    return endpointPath
  }, [])

  const localBackendBase = useMemo(() => {
    const customLocalBase = import.meta.env.VITE_LOCAL_BACKEND_URL?.trim()
    return customLocalBase || 'http://localhost:4002'
  }, [])

  const resolveRequestUrls = (url) => {
    if (!url?.startsWith('/')) {
      return [url]
    }

    // In production, relative API URLs should be served via configured base URL.
    if (!import.meta.env.DEV) {
      return [url]
    }

    return [url, `${localBackendBase}${url}`]
  }

  const startBookingFlow = async () => {
    setShowChatbot(true)
    setIsBooking(true)
    try {
      const data = await postJsonWithFallback(`${bookingBaseUrl}/start`, {
        sessionId: `session-${Date.now()}`,
      })
      setBookingSession(data.sessionId)
      setCurrentBookingStep(data.nextStep)
      setBookingData({})
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: data.botMessage,
        },
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: error.message || 'Unable to start booking',
          isError: true,
        },
      ])
    } finally {
      setIsBooking(false)
    }
  }

  const processBookingStep = async (userInput) => {
    if (!bookingSession || !currentBookingStep) return

    setIsSending(true)
    try {
      const data = await postJsonWithFallback(`${bookingBaseUrl}/step`, {
        sessionId: bookingSession,
        currentStep: currentBookingStep,
        userInput,
        bookingData,
      })
      setBookingData(data.bookingData)
      setCurrentBookingStep(data.nextStep)
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: data.botMessage,
        },
      ])
      if (data.showPaymentButton) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          {
            ...prev[prev.length - 1],
            action: {
              label: 'Proceed to Payment',
              handler: () => handleBookingPayment(data.bookingData),
            },
          },
        ])
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: error.message || 'Error processing booking',
          isError: true,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const handleBookingPayment = async (bookData) => {
    if (isPaying) return

    setIsPaying(true)

    try {
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded) {
        throw new Error('Unable to load payment gateway.')
      }

      const config = await getJsonWithFallback(`${paymentBaseUrl}/config`)
      const orderData = await postJsonWithFallback(`${paymentBaseUrl}/create-order`, {
        ticketType: 'adult',
        quantity: bookData.numberOfPersons,
      })

      const options = {
        key: config?.keyId,
        amount: orderData?.order?.amount,
        currency: 'INR',
        name: 'City Museum',
        description: `Booking for ${bookData.name} - ${bookData.numberOfPersons} persons`,
        order_id: orderData?.order?.id,
        handler: async (response) => {
          try {
            await postJsonWithFallback(`${paymentBaseUrl}/verify`, response)
            await postJsonWithFallback(`${bookingBaseUrl}/finalize`, {
              sessionId: bookingSession,
              bookingData: bookData,
              paymentId: response.razorpay_payment_id,
            })
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'bot',
                text: `Payment successful! Your booking is confirmed. Thank you, ${bookData.name}! Your museum visit is booked for ${bookData.numberOfPersons} persons.`,
              },
            ])
            setBookingSession(null)
            setCurrentBookingStep(null)
            setBookingData({})
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'bot',
                text: error.message || 'Payment completed but booking failed.',
                isError: true,
              },
            ])
          }
        },
        theme: {
          color: '#0f766e',
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', (response) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'bot',
            text: response?.error?.description || 'Payment failed. Please try again.',
            isError: true,
          },
        ])
      })
      razorpay.open()
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: error.message || 'Unable to start payment',
          isError: true,
        },
      ])
    } finally {
      setIsPaying(false)
    }
  }

  const parseResponseData = async (response) => {
    const raw = await response.text()
    return raw ? JSON.parse(raw) : null
  }

  const postMessage = async (text) => {
    const requestUrls = resolveRequestUrls(apiUrl)

    let lastError = null

    for (const requestUrl of requestUrls) {
      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text }),
        })

        const data = await parseResponseData(response)

        if (!response.ok) {
          throw new Error(data?.error || `Request failed (${response.status})`)
        }

        if (!data) {
          throw new Error('Server returned an empty response.')
        }

        return data
      } catch (error) {
        lastError = error
      }
    }

    if (lastError?.message?.toLowerCase?.().includes('failed to fetch')) {
      throw new Error('Unable to reach backend server. Verify VITE_API_BASE_URL and backend deployment URL.')
    }

    throw lastError || new Error('Unable to reach backend server')
  }

  const postJsonWithFallback = async (url, body) => {
    const requestUrls = resolveRequestUrls(url)

    let lastError = null

    for (const requestUrl of requestUrls) {
      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })

        const data = await parseResponseData(response)

        if (!response.ok) {
          throw new Error(data?.error || `Request failed (${response.status})`)
        }

        return data
      } catch (error) {
        lastError = error
      }
    }

    if (lastError?.message?.toLowerCase?.().includes('failed to fetch')) {
      throw new Error('Unable to reach backend server. Verify VITE_API_BASE_URL and backend deployment URL.')
    }

    throw lastError || new Error('Unable to reach backend server')
  }

  const getJsonWithFallback = async (url) => {
    const requestUrls = resolveRequestUrls(url)

    let lastError = null

    for (const requestUrl of requestUrls) {
      try {
        const response = await fetch(requestUrl)
        const data = await parseResponseData(response)

        if (!response.ok) {
          throw new Error(data?.error || `Request failed (${response.status})`)
        }

        return data
      } catch (error) {
        lastError = error
      }
    }

    if (lastError?.message?.toLowerCase?.().includes('failed to fetch')) {
      throw new Error('Unable to reach backend server. Verify VITE_API_BASE_URL and backend deployment URL.')
    }

    throw lastError || new Error('Unable to reach backend server')
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const handlePayment = async (ticketType = 'adult', quantity = 1) => {
    if (isPaying) return

    setIsPaying(true)

    try {
      const scriptLoaded = await loadRazorpayScript()

      if (!scriptLoaded) {
        throw new Error('Unable to load payment gateway. Check internet connection and try again.')
      }

      const config = await getJsonWithFallback(`${paymentBaseUrl}/config`)
      const orderData = await postJsonWithFallback(`${paymentBaseUrl}/create-order`, {
        ticketType,
        quantity: Number(quantity),
      })

      const options = {
        key: config?.keyId,
        amount: orderData?.order?.amount,
        currency: orderData?.order?.currency || 'INR',
        name: 'City Museum',
        description: `${ticketType} ticket x ${quantity}`,
        order_id: orderData?.order?.id,
        handler: async (response) => {
          try {
            const verification = await postJsonWithFallback(`${paymentBaseUrl}/verify`, response)

            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'bot',
                text: verification?.message || 'Payment successful and verified.',
              },
            ])
          } catch (error) {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'bot',
                text: error.message || 'Payment completed but verification failed.',
                isError: true,
              },
            ])
          }
        },
        theme: {
          color: '#0f766e',
        },
      }

      const razorpay = new window.Razorpay(options)

      razorpay.on('payment.failed', (response) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'bot',
            text:
              response?.error?.description ||
              'Payment was not completed. You can try again.',
            isError: true,
          },
        ])
      })

      razorpay.open()
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: 'bot',
          text: error.message || 'Unable to start payment process',
          isError: true,
        },
      ])
    } finally {
      setIsPaying(false)
    }
  }

  const sendMessage = async (messageText) => {
    const text = messageText.trim()
    if (!text || isSending) return

    setShowChatbot(true)

    const userMessage = {
      id: Date.now(),
      role: 'user',
      text,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')

    // If in booking flow, process booking step
    if (bookingSession) {
      await processBookingStep(text)
      return
    }

    // Check if user wants to book tickets
    if (text.toLowerCase().includes('book') || text.toLowerCase().includes('tickets')) {
      await startBookingFlow()
      return
    }

    setIsSending(true)

    try {
      const data = await postMessage(text)

      const isTicketRelated =
        text.toLowerCase().includes('ticket') ||
        text.toLowerCase().includes('price') ||
        text.toLowerCase().includes('cost') ||
        text.toLowerCase().includes('pay')

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: data?.botMessage || 'No response from bot',
      }

      if (isTicketRelated && data?.botMessage) {
        botMessage.action = {
          label: 'Start Booking',
          handler: () => startBookingFlow(),
        }
      }

      setMessages((prev) => [
        ...prev,
        botMessage,
      ])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'bot',
          text: error.message || 'Something went wrong',
          isError: true,
        },
      ])
    } finally {
      setIsSending(false)
    }
  }

  const onSubmit = (event) => {
    event.preventDefault()
    sendMessage(input)
  }

  const openChatWithPrompt = (prompt) => {
    sendMessage(prompt)
  }

  return (
    <main className="page">
      <section className="landing-shell" aria-label="Museum home page">
        <header className="topbar">
          <div>
            <p className="eyebrow">Chatbot Project</p>
            <h1>Museum Assistant</h1>
          </div>
          <button type="button" className="ghost-button" onClick={() => setShowChatbot(true)}>
            Visit the chatbot
          </button>
        </header>

        <section className="hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker">A modern museum experience</p>
            <h2>Discover the museum before you even step inside.</h2>
            <p className="hero-text">
              Explore highlights, visitor information, and ticket guidance on the home page, then switch into the
              chatbot for instant answers and real booking support.
            </p>

            <div className="hero-actions">
              <button type="button" className="primary-button" onClick={() => openChatWithPrompt('Tell me about the museum timings')}>
                Ask the assistant
              </button>
              <button type="button" className="secondary-button" onClick={() => openChatWithPrompt('I want to book tickets')}>
                Book a visit
              </button>
            </div>

            <div className="stats-row">
              {museumStats.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </article>
              ))}
            </div>
          </div>

          <div className="hero-visual">
            <figure className="hero-image-card">
              <img src={museumHero} alt="Museum building and outdoor area" />
            </figure>
            <div className="gallery-grid">
              <figure><img src={galleryOne} alt="Museum interior view 1" /></figure>
              <figure><img src={galleryTwo} alt="Museum interior view 2" /></figure>
              <figure><img src={galleryThree} alt="Museum exhibit view 3" /></figure>
              <figure><img src={galleryFour} alt="Museum exhibit view 4" /></figure>
              <figure><img src={galleryFive} alt="Museum exhibit view 5" /></figure>
            </div>
          </div>
        </section>

        <section className="info-grid">
          {museumHighlights.map((item) => (
            <article key={item.title} className="info-card">
              <p className="info-label">Museum highlight</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </section>

        <section className="visit-strip">
          {visitCards.map((card) => (
            <article key={card.title} className="visit-card">
              <h3>{card.title}</h3>
              <p>{card.detail}</p>
              <button type="button" className="text-button" onClick={() => openChatWithPrompt(card.prompt)}>
                Ask in chatbot
              </button>
            </article>
          ))}
        </section>
      </section>

      <section className="chat-shell" ref={chatbotSectionRef} aria-label="Chatbot interface">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Live concierge</p>
            <h2>Chatbot assistant</h2>
          </div>
          <p className="subtitle">
            {showChatbot
              ? 'Ask about timings, tickets, accessibility, bookings, and payment.'
              : 'Open the chatbot from the home page to start chatting.'}
          </p>
        </header>

        {!showChatbot ? (
          <div className="chat-gate">
            <p className="gate-badge">Interactive museum help</p>
            <h3>Plan your visit with one tap.</h3>
            <p>
              The chatbot can answer real visitor questions, guide you through booking, and help you complete payment.
            </p>
            <button type="button" className="primary-button" onClick={() => setShowChatbot(true)}>
              Enter chatbot
            </button>
          </div>
        ) : (
          <>
            <div className="chat-window" ref={chatWindowRef} role="log" aria-live="polite">
              {messages.map((message) => (
                <article
                  key={message.id}
                  className={`message ${message.role === 'user' ? 'message-user' : 'message-bot'} ${
                    message.isError ? 'message-error' : ''
                  }`}
                >
                  <p>{message.text}</p>
                  {message.action && (
                    <button
                      type="button"
                      className="message-action-btn"
                      onClick={() => message.action.handler()}
                      disabled={isPaying}
                    >
                      {message.action.label}
                    </button>
                  )}
                </article>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={onSubmit}>
              <input
                type="text"
                placeholder="Ask about timings, tickets, directions, accessibility, bookings..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isSending}
              />
              <button type="submit" disabled={isSending || !input.trim()}>
                {isSending ? 'Sending...' : 'Send'}
              </button>
            </form>

            <p className="chat-hint">
              Try asking about museum timings, exhibits, ticket prices, parking, accessibility, guided tours, or
              booking support.
            </p>
          </>
        )}
      </section>
    </main>
  )
}

export default App
