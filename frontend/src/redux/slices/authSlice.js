import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: {
      _id: null,
      name : null,
      email : null,
      avatar : null,
    },
    isLoggedIn: false,
  },
  reducers: {
    setUserInfo: (state, action) => {
      const { _id , name , email , avatar} = action.payload;

      state.user = { _id , name , email , avatar };

      console.log('setUser payload:', action.payload);
      state.isLoggedIn = true;
    },
    clearUser: (state) => {
      state.user = {
        _id: null,
        name : null,
        email : null,
        avatar : null,
      };
      state.isLoggedIn = false;
    },
  },
});

export const { setUserInfo, clearUser } = authSlice.actions;
export default authSlice.reducer;