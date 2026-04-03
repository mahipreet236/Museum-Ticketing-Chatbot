import Booking from "../models/booking.model.js"

const TICKET_PRICES = {
  adult: 200,
  student: 120,
  senior: 100,
}

const BOOKING_STEPS = {
  START: "start",
  ASK_NAME: "ask_name",
  ASK_PERSONS: "ask_persons",
  ASK_ADULTS: "ask_adults",
  ASK_STUDENTS: "ask_students",
  ASK_SENIORS: "ask_seniors",
  ASK_CHILDREN: "ask_children",
  CONFIRM: "confirm",
  PAYMENT: "payment",
}

export const startBooking = async (req, res) => {
  try {
    const sessionId = req.body?.sessionId || `session-${Date.now()}`

    const steps = {
      currentStep: BOOKING_STEPS.ASK_NAME,
      sessionId,
      bookingData: {},
    }

    return res.status(200).json({
      sessionId,
      botMessage:
        "Great! Let's start booking your museum tickets. What is your name?",
      nextStep: BOOKING_STEPS.ASK_NAME,
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to start booking" })
  }
}

export const processBookingStep = async (req, res) => {
  try {
    const { sessionId, currentStep, userInput, bookingData = {} } = req.body

    if (!sessionId || !currentStep || !userInput) {
      return res.status(400).json({ error: "Missing required booking parameters" })
    }

    let updatedData = { ...bookingData }
    let nextStep = currentStep
    let botMessage = ""
    let showPaymentButton = false

    switch (currentStep) {
      case BOOKING_STEPS.ASK_NAME:
        updatedData.name = userInput.trim()
        nextStep = BOOKING_STEPS.ASK_PERSONS
        botMessage =
          "Thanks, " + userInput + "! How many total persons will be visiting?"
        break

      case BOOKING_STEPS.ASK_PERSONS:
        const totalPersons = parseInt(userInput)
        if (isNaN(totalPersons) || totalPersons < 1 || totalPersons > 100) {
          return res.status(400).json({
            error: "Please enter a valid number between 1 and 100",
          })
        }
        updatedData.numberOfPersons = totalPersons
        nextStep = BOOKING_STEPS.ASK_ADULTS
        botMessage = `You have ${totalPersons} persons. How many are adults?`
        break

      case BOOKING_STEPS.ASK_ADULTS:
        const adults = parseInt(userInput)
        if (isNaN(adults) || adults < 0) {
          return res.status(400).json({ error: "Please enter a valid number for adults" })
        }
        updatedData.adultCount = adults
        nextStep = BOOKING_STEPS.ASK_STUDENTS
        botMessage = `Got it, ${adults} adults. How many are students (120 Rs each)?`
        break

      case BOOKING_STEPS.ASK_STUDENTS:
        const students = parseInt(userInput)
        if (isNaN(students) || students < 0) {
          return res.status(400).json({ error: "Please enter a valid number for students" })
        }
        updatedData.studentCount = students
        nextStep = BOOKING_STEPS.ASK_SENIORS
        botMessage = `Got it, ${students} students. How many are senior citizens (100 Rs each)?`
        break

      case BOOKING_STEPS.ASK_SENIORS:
        const seniors = parseInt(userInput)
        if (isNaN(seniors) || seniors < 0) {
          return res.status(400).json({ error: "Please enter a valid number for seniors" })
        }
        updatedData.seniorCount = seniors
        nextStep = BOOKING_STEPS.ASK_CHILDREN
        botMessage = `Got it, ${seniors} seniors. How many young children (below 6, free entry)?`
        break

      case BOOKING_STEPS.ASK_CHILDREN:
        const children = parseInt(userInput)
        if (isNaN(children) || children < 0) {
          return res.status(400).json({ error: "Please enter a valid number for children" })
        }
        updatedData.numberOfChildren = children

        const totalAmount =
          updatedData.adultCount * TICKET_PRICES.adult +
          updatedData.studentCount * TICKET_PRICES.student +
          updatedData.seniorCount * TICKET_PRICES.senior

        updatedData.totalAmount = totalAmount

        nextStep = BOOKING_STEPS.CONFIRM
        botMessage = `Perfect! Here's your booking summary:\n- Adults: ${updatedData.adultCount} x Rs 200 = Rs ${updatedData.adultCount * 200}\n- Students: ${updatedData.studentCount} x Rs 120 = Rs ${updatedData.studentCount * 120}\n- Seniors: ${updatedData.seniorCount} x Rs 100 = Rs ${updatedData.seniorCount * 100}\n- Children (free): ${children}\n\nTotal Payable: Rs ${totalAmount}`
        showPaymentButton = true
        break

      default:
        return res.status(400).json({ error: "Invalid booking step" })
    }

    return res.status(200).json({
      sessionId,
      botMessage,
      nextStep,
      bookingData: updatedData,
      showPaymentButton,
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to process booking step" })
  }
}

export const finalizeBooking = async (req, res) => {
  try {
    const { sessionId, bookingData, paymentId } = req.body

    if (!bookingData || !bookingData.name) {
      return res.status(400).json({ error: "Missing booking data" })
    }

    const booking = await Booking.create({
      name: bookingData.name,
      numberOfPersons: bookingData.numberOfPersons,
      numberOfChildren: bookingData.numberOfChildren,
      adultCount: bookingData.adultCount,
      studentCount: bookingData.studentCount,
      seniorCount: bookingData.seniorCount,
      totalAmount: bookingData.totalAmount,
      paymentId: paymentId || null,
      paymentStatus: paymentId ? "success" : "pending",
      visitDate: new Date(),
    })

    return res.status(201).json({
      message: "Booking confirmed and saved",
      booking,
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to finalize booking" })
  }
}

export const getBookingStats = async (_req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayBookings = await Booking.find({
      visitDate: {
        $gte: today,
        $lt: tomorrow,
      },
    })

    const totalPersons = todayBookings.reduce(
      (sum, b) => sum + b.numberOfPersons,
      0,
    )
    const totalChildren = todayBookings.reduce(
      (sum, b) => sum + b.numberOfChildren,
      0,
    )
    const totalRevenue = todayBookings.reduce((sum, b) => sum + b.totalAmount, 0)

    return res.status(200).json({
      date: today.toISOString().split("T")[0],
      totalBookings: todayBookings.length,
      totalPersons,
      totalChildren,
      totalRevenue,
      bookings: todayBookings,
    })
  } catch (error) {
    return res.status(500).json({ error: "Unable to fetch booking stats" })
  }
}
