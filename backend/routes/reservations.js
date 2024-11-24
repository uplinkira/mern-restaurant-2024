const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');
const Restaurant = require('../models/Restaurant');
const authMiddleware = require('../middleware/authMiddleware'); // Ensure user is authenticated

// **POST create a new reservation**
router.post('/', authMiddleware, async (req, res) => {
  const { restaurantId, menuId, dishes, date, time, numberOfGuests, specialRequests } = req.body;

  try {
    // Check restaurant availability
    const available = await Reservation.checkAvailability(restaurantId, date, time, numberOfGuests);
    if (!available) {
      return res.status(400).json({ message: 'Restaurant not available for the selected time or not enough seats' });
    }

    // Create new reservation
    const reservation = new Reservation({
      user: req.userId, // Get user from the authentication middleware
      restaurant: restaurantId,
      menu: menuId,
      dishes,
      date,
      time,
      numberOfGuests,
      specialRequests,
    });

    // Calculate total price and save reservation
    await reservation.calculateTotalPrice();
    await reservation.save();

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('Error creating reservation:', error);
    res.status(500).json({ message: 'Failed to create reservation' });
  }
});

// **GET all reservations for the logged-in user**
router.get('/my-reservations', authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.userId })
      .populate('restaurant')
      .populate('dishes.dish');

    res.status(200).json(reservations);
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    res.status(500).json({ message: 'Failed to fetch reservations' });
  }
});

// **PUT update an existing reservation**
router.put('/:reservationId', authMiddleware, async (req, res) => {
  const { reservationId } = req.params;
  const { date, time, numberOfGuests, specialRequests } = req.body;

  try {
    const reservation = await Reservation.findOne({ _id: reservationId, user: req.userId });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    // Update reservation details
    reservation.date = date || reservation.date;
    reservation.time = time || reservation.time;
    reservation.numberOfGuests = numberOfGuests || reservation.numberOfGuests;
    reservation.specialRequests = specialRequests || reservation.specialRequests;
    reservation.updatedAt = new Date();

    await reservation.save();
    res.status(200).json({ message: 'Reservation updated successfully', reservation });
  } catch (error) {
    console.error('Error updating reservation:', error);
    res.status(500).json({ message: 'Failed to update reservation' });
  }
});

// **POST confirm a reservation**
router.post('/:reservationId/confirm', authMiddleware, async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findOne({ _id: reservationId, user: req.userId });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    await reservation.confirm();
    res.status(200).json({ message: 'Reservation confirmed successfully', reservation });
  } catch (error) {
    console.error('Error confirming reservation:', error);
    res.status(500).json({ message: 'Failed to confirm reservation' });
  }
});

// **POST cancel a reservation**
router.post('/:reservationId/cancel', authMiddleware, async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findOne({ _id: reservationId, user: req.userId });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    await reservation.cancel();
    res.status(200).json({ message: 'Reservation canceled successfully', reservation });
  } catch (error) {
    console.error('Error canceling reservation:', error);
    res.status(500).json({ message: 'Failed to cancel reservation' });
  }
});

// **DELETE a reservation**
router.delete('/:reservationId', authMiddleware, async (req, res) => {
  const { reservationId } = req.params;

  try {
    const reservation = await Reservation.findOneAndDelete({ _id: reservationId, user: req.userId });
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    res.status(200).json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error('Error deleting reservation:', error);
    res.status(500).json({ message: 'Failed to delete reservation' });
  }
});

module.exports = router;
