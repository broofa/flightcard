import { useEffect, useState } from 'react';
import { type MotorDB, loadMotorDB } from './MotorDB';

export function useMotorDB() {
  const [motorDB, setMotorDB] = useState<MotorDB>();

  useEffect(() => {
    loadMotorDB().then(setMotorDB);
  }, []);

  return motorDB;
}
