import axios from 'axios';

export const SEARCH_REQUEST = 'SEARCH_REQUEST';
export const SEARCH_SUCCESS = 'SEARCH_SUCCESS';
export const SEARCH_FAILURE = 'SEARCH_FAILURE';

export const searchRestaurantsAndDishes = (query) => async (dispatch) => {
  dispatch({ type: SEARCH_REQUEST });
  try {
    const response = await axios.get(`/api/restaurants/search?q=${query}`);
    dispatch({ type: SEARCH_SUCCESS, payload: response.data });
  } catch (error) {
    dispatch({ type: SEARCH_FAILURE, payload: error.message });
  }
};