import crypto from "crypto"
import Razorpay from "razorpay"

const ticketPricing = {
    adult: 200,
    student: 120,
    senior: 100,
}

const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
        return null
    }

    return new Razorpay({
        key_id: keyId,
        key_secret: keySecret,
    })
}

export const getPaymentConfig = async (_req, res) => {
    if (!process.env.RAZORPAY_KEY_ID) {
        return res.status(500).json({
            error: "Payment gateway is not configured on server",
        })
    }

    return res.status(200).json({
        keyId: process.env.RAZORPAY_KEY_ID,
        currency: "INR",
        ticketPricing,
    })
}

export const createOrder = async (req, res) => {
    try {
        const razorpay = getRazorpayClient()

        if (!razorpay) {
            return res.status(500).json({
                error: "Payment gateway is not configured on server",
            })
        }

        const ticketType = String(req.body?.ticketType || "adult").toLowerCase()
        const quantity = Number(req.body?.quantity || 1)

        if (!ticketPricing[ticketType]) {
            return res.status(400).json({ error: "Invalid ticket type selected" })
        }

        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
            return res.status(400).json({ error: "Quantity should be between 1 and 10" })
        }

        const amountInRupees = ticketPricing[ticketType] * quantity
        const amountInPaise = amountInRupees * 100

        const order = await razorpay.orders.create({
            amount: amountInPaise,
            currency: "INR",
            receipt: `museum-${Date.now()}`,
            notes: {
                ticketType,
                quantity: String(quantity),
            },
        })

        return res.status(200).json({
            order,
            amountInRupees,
            ticketType,
            quantity,
        })
    } catch (error) {
        return res.status(500).json({ error: "Unable to create payment order" })
    }
}

export const verifyPayment = async (req, res) => {
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET

        if (!keySecret) {
            return res.status(500).json({
                error: "Payment gateway is not configured on server",
            })
        }

        const razorpayOrderId = req.body?.razorpay_order_id
        const razorpayPaymentId = req.body?.razorpay_payment_id
        const razorpaySignature = req.body?.razorpay_signature

        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return res.status(400).json({ error: "Missing payment verification details" })
        }

        const body = `${razorpayOrderId}|${razorpayPaymentId}`
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(body)
            .digest("hex")

        const isVerified = expectedSignature === razorpaySignature

        if (!isVerified) {
            return res.status(400).json({
                verified: false,
                error: "Payment verification failed",
            })
        }

        return res.status(200).json({
            verified: true,
            message: "Payment successful and verified",
            paymentId: razorpayPaymentId,
            orderId: razorpayOrderId,
        })
    } catch (error) {
        return res.status(500).json({ error: "Unable to verify payment" })
    }
}
