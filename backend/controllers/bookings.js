const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");

// @desc    Get all bookings for logged in user or all bookings if admin
// @route   GET /api/v1/bookings
// @access  Private
exports.getBookings = async (req, res, next) => {
  let bookings;
  if (req.user.role === "admin") {
    // If the user is an admin, fetch all bookings from the database
    bookings = await Booking.find({}).populate("hotel");
  } else {
    // If the user is not an admin, only fetch bookings for the logged-in user
    bookings = await Booking.find({ user: req.user.id }).populate("hotel");
  }

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
};

// @desc    Create new booking
// @route   POST /api/v1/hotels/:hotelId/bookings
// @access  Private
exports.createBooking = async (req, res, next) => {
  req.body.user = req.user.id;
  req.body.hotel = req.params.hotelId;

  const hotel = await Hotel.findById(req.params.hotelId);
  if (!hotel) {
    return res.status(404).json({
      success: false,
      message: `No hotel found with the id of ${req.params.hotelId}`,
    });
  }

  // Fetch all existing bookings of the user
  const existingBookings = await Booking.find({ user: req.user.id });

  // Calculate total nights already booked
  let totalNights = 0;
  existingBookings.forEach((booking) => {
    const checkIn = new Date(booking.bookingDate.start);
    const checkOut = new Date(booking.bookingDate.end);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      console.error("Invalid date in existing bookings:", booking);
    } else {
      const nights = (checkOut - checkIn) / (1000 * 3600 * 24);
      totalNights += nights;
    }
  });

  // Assuming req.body contains bookingDate with start and end properties
  const newCheckIn = new Date(req.body.bookingDate.start);
  const newCheckOut = new Date(req.body.bookingDate.end);
  if (isNaN(newCheckIn.getTime()) || isNaN(newCheckOut.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Invalid check-in or check-out date for new booking",
    });
  }

  const newBookingNights = (newCheckOut - newCheckIn) / (1000 * 3600 * 24);

  console.log("Total nights now:", totalNights);
  console.log("NewBooking nights:", newBookingNights);

  if (totalNights + newBookingNights > 3) {
    return res.status(400).json({
      success: false,
      message: "User can only book up to 3 nights in total",
    });
  }

  const booking = await Booking.create(req.body);

  res.status(201).json({
    success: true,
    data: booking,
  });
};

// @desc    Update booking
// @route   PUT /api/v1/bookings/:id
// @access  Private
exports.updateBooking = async (req, res, next) => {
  try {
    let booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with the id of ${req.params.id}`,
      });
    }

    // Ensure the user is the owner of the booking or an admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User not authorized to update this booking`,
      });
    }

    booking = await Booking.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete booking
// @route   DELETE /api/v1/bookings/:id
// @access  Private
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `No booking found with the id of ${req.params.id}`,
      });
    }

    // Ensure the user is the owner of the booking or an admin
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(401).json({
        success: false,
        message: `User not authorized to delete this booking`,
      });
    }

    await booking.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: `Booking with id ${req.params.id} was deleted`,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = exports;
