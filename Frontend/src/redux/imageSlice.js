import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Async action to call the backend API
export const generateImage = createAsyncThunk("image/generate", async (prompt, { rejectWithValue }) => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/images/generate`, { prompt });

    return response.data.imageUrl; // Assuming backend returns { imageUrl: "link_to_image" }
  } catch (error) {
    return rejectWithValue(error.response?.data?.message || "Failed to generate image");
  }
});

const imageSlice = createSlice({
  name: "image",
  initialState: { imageUrl: "", loading: false, error: null },
  reducers: {
    clearImage: (state) => {
      state.imageUrl = "";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateImage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateImage.fulfilled, (state, action) => {
        state.loading = false;
        state.imageUrl = action.payload;
      })
      .addCase(generateImage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearImage } = imageSlice.actions;
export default imageSlice.reducer;
