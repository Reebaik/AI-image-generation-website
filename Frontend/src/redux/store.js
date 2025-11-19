import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import imageReducer from "./imageSlice";
import subscriptionReducer from "./slices/subscriptionSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    image: imageReducer,
    subscription: subscriptionReducer,
  },
});

export default store;

