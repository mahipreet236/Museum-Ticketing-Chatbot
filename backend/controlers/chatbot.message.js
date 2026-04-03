import User from "../models/user.model.js"

const museumIntents = [
    {
        keywords: ["hello", "hi", "hey", "good morning", "good evening"],
        reply: "Hello! Welcome to the museum assistant. You can ask me about tickets, timings, location, exhibits, and facilities."
    },
    {
        keywords: ["timing", "open", "close", "hours", "opening time"],
        reply: "The museum is open Tuesday to Sunday from 10:00 AM to 6:00 PM. Last entry is at 5:15 PM. We are closed on Mondays."
    },
    {
        keywords: ["monday", "closed day", "weekly off"],
        reply: "Our weekly holiday is Monday. On public holidays, special schedules may apply."
    },
    {
        keywords: ["ticket", "price", "cost", "entry fee", "how much"],
        reply: "Ticket prices are: Adults Rs 200, Students Rs 120 (with valid ID), Children (below 6) free, Senior citizens Rs 100."
    },
    {
        keywords: ["student", "college id", "school id"],
        reply: "Students get discounted tickets at Rs 120. Please carry a valid school or college ID card."
    },
    {
        keywords: ["senior", "elderly"],
        reply: "Senior citizens (60+) can buy tickets for Rs 100 with valid age proof."
    },
    {
        keywords: ["child", "kids", "kid", "children"],
        reply: "Children below 6 years can enter for free. For children above 6, regular child/student pricing applies based on age and ID."
    },
    {
        keywords: ["group", "school trip", "bulk booking", "tour group"],
        reply: "For group bookings (15+ visitors), we offer scheduled slots and concessions. Please contact us 48 hours in advance."
    },
    {
        keywords: ["book", "online", "reservation", "advance"],
        reply: "You can book tickets online through the official museum portal. Walk-in tickets are also available, subject to daily capacity."
    },
    {
        keywords: ["cancel", "refund", "reschedule"],
        reply: "Tickets are refundable only if cancelled 24 hours before your slot. Rescheduling is allowed once, subject to availability."
    },
    {
        keywords: ["location", "address", "where", "map"],
        reply: "The museum is located in the city heritage district near Central Park. Search for 'City Museum Main Gate' on maps for exact navigation."
    },
    {
        keywords: ["parking", "car parking", "bike parking"],
        reply: "Paid parking is available at Gate 2. Two-wheelers and cars are both supported, and EV charging is available in limited slots."
    },
    {
        keywords: ["metro", "bus", "public transport", "train"],
        reply: "The nearest metro station is Heritage Square (about 8 minutes walking). Bus routes 12, 18, and 41 stop near the museum entrance."
    },
    {
        keywords: ["wheelchair", "accessible", "accessibility", "lift", "ramp"],
        reply: "The museum is wheelchair accessible with ramps, elevators, and accessible washrooms on all major floors."
    },
    {
        keywords: ["guided tour", "guide", "tour timing", "docent"],
        reply: "Guided tours run at 11:00 AM, 1:30 PM, and 4:00 PM daily. English and Hindi tours are available."
    },
    {
        keywords: ["audio guide", "headset", "app guide"],
        reply: "Audio guides are available in English, Hindi, and French for Rs 80 per device. A mobile app guide is also available."
    },
    {
        keywords: ["photography", "camera", "video", "reel"],
        reply: "Mobile photography is allowed in most galleries without flash. Professional cameras and videography require prior permission."
    },
    {
        keywords: ["cloak room", "locker", "bags", "luggage"],
        reply: "A cloak room is available near the main entrance. Large bags and luggage must be deposited before entering galleries."
    },
    {
        keywords: ["food", "cafe", "restaurant", "snacks", "water"],
        reply: "The museum cafe is open from 10:30 AM to 5:30 PM and serves snacks, beverages, and vegetarian meals. Water stations are available on each floor."
    },
    {
        keywords: ["shop", "souvenir", "gift"],
        reply: "Our souvenir shop near Exit Gate 1 offers books, postcards, replicas, and handicrafts inspired by current exhibitions."
    },
    {
        keywords: ["current exhibition", "exhibit", "what to see", "gallery"],
        reply: "Current highlights include Ancient Civilizations Gallery, Textile Heritage Hall, and the Interactive Science Wing."
    },
    {
        keywords: ["special event", "workshop", "activity", "children workshop"],
        reply: "Weekend activities include pottery demos, heritage walks, and kids workshops. Ask at the help desk for the weekly schedule."
    },
    {
        keywords: ["how long", "duration", "visit time"],
        reply: "Most visitors spend around 2 to 3 hours. If you include guided tours and special exhibits, plan for around 4 hours."
    },
    {
        keywords: ["crowd", "rush", "best time", "less crowded"],
        reply: "Weekday mornings (10:00 AM to 12:00 PM) are usually less crowded. Weekends and holidays are peak hours."
    },
    {
        keywords: ["rules", "allowed", "not allowed", "policy"],
        reply: "Please avoid touching artifacts, maintain silence in galleries, and follow no-flash rules where indicated. Outside food is not allowed in exhibit zones."
    },
    {
        keywords: ["contact", "phone", "email", "help desk"],
        reply: "You can contact the help desk at +91-90000-12345 or email support@citymuseum.example for booking and visit assistance."
    },
    {
        keywords: ["membership", "annual pass", "member"],
        reply: "Annual membership starts at Rs 1500 and includes unlimited entry, priority event booking, and 10% discount at the museum shop."
    },
    {
        keywords: ["donate", "donation", "support museum"],
        reply: "Thank you for supporting us. Donations can be made at the front desk or through the official website donation page."
    },
    {
        keywords: ["language", "hindi", "english", "regional"],
        reply: "Visitor assistance is available in English and Hindi. Printed guides in additional languages are available at the information counter."
    },
    {
        keywords: ["bye", "goodbye", "thanks", "thank you"],
        reply: "You are welcome! Have a great visit to the museum."
    },
]

const normalizeText = (value) => {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
}

const getBotResponse = (message) => {
    const normalizedMessage = normalizeText(message)

    const matchedIntent = museumIntents.find((intent) => {
        return intent.keywords.some((keyword) => normalizedMessage.includes(keyword))
    })

    if (matchedIntent) {
        return matchedIntent.reply
    }

    return "I can help with museum timings, ticket prices, location, exhibits, facilities, bookings, and visit planning. Please ask your question in a little more detail."
}

export const Message = async (req, res) => {
    try {
        const text = req.body?.text;

        if (!text?.trim()) {
            return res.status(400).json({ error: "Message can not be empty" })
        }

        const user = await User.create({
            sender: "user",
            text: text.trim()
        })

        const botResponse = getBotResponse(text)

        return res.status(200).json({
            userMessage:user.text,
            botMessage:botResponse
        }) 
    } catch (error) {
        console.error("Message controller error:", error)
        return res.status(500).json({
            error: "Internal server error",
            details: process.env.NODE_ENV === "production" ? undefined : error.message,
        })
    }
}