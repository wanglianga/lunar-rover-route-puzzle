import { useNavigate } from 'react-router-dom';
import MainMenu from '../components/MainMenu';

export default function HomePage() {
  const navigate = useNavigate();

  const handleSelectLevel = (levelId: number) => {
    navigate(`/game/${levelId}`);
  };

  return <MainMenu onSelectLevel={handleSelectLevel} />;
}
