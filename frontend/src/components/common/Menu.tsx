import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Card } from '@mui/material';

interface TileItem {
  label: string;
  id: number;
  image?: string;
  path: string;
}

interface MenuProps {
  tiles?: TileItem[];
  menuType?: string;
  isAdmin?: boolean;
}

const Menu: React.FC<MenuProps> = ({ tiles, menuType, isAdmin }) => {
  const navigate = useNavigate();

  const defaultTiles: TileItem[] = [
    { label: 'Default Card 1', id: 1, path: '/default/1' },
    { label: 'Default Card 2', id: 2, path: '/default/2' },
    { label: 'Default Card 3', id: 3, path: '/default/3' },
    { label: 'Default Card 4', id: 4, path: '/default/4' },
    { label: 'Default Card 5', id: 5, path: '/default/5' },
    { label: 'Default Card 6', id: 6, path: '/default/6' },
  ];

  const tilesToDisplay = tiles || defaultTiles;

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <Box sx={{ width: '100%', p: 3, boxSizing: 'border-box' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', color: '#1A2027' }}>
        Menu {isAdmin && "(Admin View)"}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', width: '100%' }}>
        {tilesToDisplay.map((tile, i) => (
          <Box key={tile.id} sx={{ width: 'calc(33.33% - 16px)', minWidth: '300px' }}>
            <Card 
              sx={{ borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', cursor: 'pointer' }}
              onClick={() => handleCardClick(tile.path)}
            >
              <Box sx={{ 
                height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: i % 3 === 0 ? '#e3f2fd' : i % 3 === 1 ? '#f3e5f5' : '#e8f5e9',
                p: 2,
                flexDirection: 'column',
                gap: 1,
              }}>
                {tile.image && (
                  <img src={tile.image} alt={tile.label} style={{ height: 60, width: 'auto' }} />
                )}
                <Typography variant="h6">{tile.label}</Typography>
              </Box>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
    
  );
};

export default Menu;