import { useSelector, useDispatch } from "react-redux";
import { logout } from "../redux/userSlice";

const Profile = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user.user);
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  return (
    <div>
      {isAuthenticated ? (
        <>
          <h2>Welcome, {user.username}!</h2>
          <button onClick={() => dispatch(logout())}>Logout</button>
        </>
      ) : (
        <h2>Please log in.</h2>
      )}
    </div>
  );
};

export default Profile;
