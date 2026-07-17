import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

/** Redireciona para o login se não houver token de admin válido em sessão. */
export function useRequireAdmin() {
  const { adminToken } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!adminToken) navigate('/admin');
  }, [adminToken]);

  return adminToken;
}
