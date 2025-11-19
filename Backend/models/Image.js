const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User",
    },
    url: {
        type: String,
        required: true,
    },
    prompt: {
        type: String,
        required: true,
    },
    parameters: {
        inferenceSteps: {
            type: Number,
            default: 4
        },
        guidanceScale: {
            type: Number,
            default: 0.5
        },
        width: {
            type: Number,
            default: 512
        },
        height: {
            type: Number,
            default: 512
        }
    },
    likes: {
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }],
        count: {
            type: Number,
            default: 0
        }
    },
    creatorDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Image", imageSchema);
