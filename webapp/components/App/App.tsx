import { useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useMatch,
} from 'react-router-dom';
import Admin from '../Admin/Admin';
import { FlashList } from '../Flash/FlashList';
import Launch from '../Launch/Launch';
import LaunchHome from '../Launch/LaunchHome';
import Launches from '../Launches/Launches';
import Login from '../Login/Login';
import { AuthUserProvider, useAuthUser } from '../contexts/AuthIdContext';
import { LaunchStateProvider } from '../contexts/LaunchStateContext';
import { useCurrentAttendee } from '../contexts/rt_hooks';
import './App.scss';
import { HomeNavBar } from './HomeNavBar';
import { LaunchNavBar } from './LaunchNavBar';
import { Waiver } from './Waiver';
import Welcome from './Welcome';
import { Loading } from '/components/common/util';

export const APPNAME = 'FlightCard';
export const ANONYMOUS = '(anonymous)';

// REF: https://stackoverflow.com/a/69592617/109538
function RequireAuth() {
  const [authUser, loading, error] = useAuthUser();
  const location = useLocation();

  if (loading) {
    return <Loading wat='User Credentials' />;
  }

  if (error) {
    return (
      <Alert variant='danger'>Authentication error: {error.message}</Alert>
    );
  }
  if (!authUser) {
    return <Navigate to='/login' state={{ from: location }} replace />;
  }

  return <Outlet />;
}

function RequireWaiver() {
  const [attendee, loading] = useCurrentAttendee();
  if (loading) return <Loading wat='Attendee (Waiver)' />;
  return attendee?.waiverTime ? <Outlet /> : <Waiver />;
}

function connectToSocket() {
  console.log('Connecting to socket');
  const wsURL = new URL('/ws', process.env.MEMBER_API_ENDPOINT);
  const ws = new WebSocket(wsURL);
  ws.onmessage = (msg) => {
    console.log('Received message', msg.data);
  };
  ws.onopen = () => {
    console.log('Connected to socket');
    ws.send('Hello');
  };
  ws.onclose = () => {
    console.log('Disconnected from socket');
  };
  ws.onerror = (err) => {
    console.error('Socket error', err);
  };
  return ws;
}

export default function App() {
  const match = useMatch<'launchId', string>('/launches/:launchId/*');
  const { launchId } = match?.params ?? {};

  useEffect(() => {
    connectToSocket();
  }, []);

  return (
    <>
      <AuthUserProvider>
        <LaunchStateProvider launchId={launchId}>
          <Routes>
            <Route path='/login' element={<Login />} />

            <Route element={<RequireAuth />}>
              <Route element={<HomeNavBar />}>
                <Route path='/' element={<Navigate to='/welcome' />} />
                <Route path='/welcome' element={<Welcome />} />
                <Route path='/admin' element={<Admin />} />
                <Route path='/launches' element={<Launches />} />
              </Route>

              <Route element={<RequireWaiver />}>
                <Route path='/launches/:launchid' element={<LaunchNavBar />}>
                  <Route index element={<LaunchHome />} />
                  <Route path='*' element={<Launch />} />
                </Route>
              </Route>
            </Route>
          </Routes>
        </LaunchStateProvider>
      </AuthUserProvider>

      <FlashList
        style={{
          position: 'fixed',
          maxWidth: 'min(90vw, 30em)',
          right: 'min(5vw, 1em)',
          bottom: '2em',
        }}
      />
    </>
  );
}
