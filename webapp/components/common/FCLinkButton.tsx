import { Button, type ButtonProps } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export function FCLinkButton({
  to,
  children,
  ...props
}: { to: unknown } & ButtonProps) {
  const navigate = useNavigate();
  return (
    <Button onClick={() => navigate(to as string)} {...props}>
      {children}
    </Button>
  );
}
