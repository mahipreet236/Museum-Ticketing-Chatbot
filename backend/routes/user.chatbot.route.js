import express from 'express'
import {Message} from '../controlers/chatbot.message.js'
import { createOrder, getPaymentConfig, verifyPayment } from '../controlers/payment.controller.js'
import { startBooking, processBookingStep, finalizeBooking, getBookingStats } from '../controlers/booking.controller.js'

const router = express.Router()

router.post("/message",Message)
router.get('/payment/config', getPaymentConfig)
router.post('/payment/create-order', createOrder)
router.post('/payment/verify', verifyPayment)

router.post('/booking/start', startBooking)
router.post('/booking/step', processBookingStep)
router.post('/booking/finalize', finalizeBooking)
router.get('/booking/stats', getBookingStats)

export default router;