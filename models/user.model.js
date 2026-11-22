const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: function () {
        return this.status === 'active';
      }
    },

    role: {
      type: String,
      required: true,
      enum: ['admin', 'user'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['pending', 'active'],
      default: 'active'
    },

    activationTokenHash: {
      type: String,
      select: false
    },

    activationTokenExpires: {
      type: Date,
      select: false
    },
    phone: {
      type: String,
      default: ''
    },

    age: {
      type: Number,
      min: 18,
      max: 60
    },

    gender: {
      type: String,
      default: ''
    },

    image: {
      type: String,
      default: ''
    },

    username: {
      type: String,
      trim: true,
      default: ''
    },

    company: {
      name: {
        type: String,
        default: ''
      },
      title: {
        type: String,
        default: ''
      }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('User', userSchema);
