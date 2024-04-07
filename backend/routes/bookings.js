const express = require("express");
const {
  getBookings,
  createBooking,
  updateBooking,
  deleteBooking,
  // add other methods here
} = require("../controllers/bookings");

const router = express.Router({ mergeParams: true });
const { protect, authorize } = require("../middleware/auth");

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: Retrieve all bookings for the logged-in user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Booking'
 */
/**
 * @swagger
 * /bookings/{hotelId}:
 *   post:
 *     summary: Create a new booking for a specific hotel
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: hotelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201:
 *         description: New booking created
 *       404:
 *         description: Hotel not found
 *       400:
 *         description: Maximum number of bookings exceeded
 */
/**
 * @swagger
 * /bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       200:
 *         description: Booking updated successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: User not authorized to update this booking
 */
/**
 * @swagger
 * /bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique ID of the booking
 *     responses:
 *       200:
 *         description: Booking deleted successfully
 *       404:
 *         description: Booking not found
 *       401:
 *         description: User not authorized to delete this booking
 */

router.route("/").get(protect, getBookings);

router.route("/:hotelId").post(protect, authorize("user"), createBooking);

router.route("/:id").put(protect, updateBooking).delete(protect, deleteBooking);

// add routes for single booking: get, update, delete

module.exports = router;
