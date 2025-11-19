import { useDispatch } from "react-redux";
import { login } from "../redux/userSlice";

const Login = () => {
  const dispatch = useDispatch();

  const handleLogin = () => {
    const fakeUser = { username: "JohnDoe", email: "john@example.com" };
    dispatch(login(fakeUser));
  };

  return <button onClick={handleLogin}>Login</button>;
};

export default Login;
