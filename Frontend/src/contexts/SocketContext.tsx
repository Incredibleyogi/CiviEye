import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { io, Socket } from 'socket.io-client'; import { API_ORIGIN } from '@/lib/api'; import { useAuth } from './AuthContext';
interface SocketContextType{socket:Socket|null;isConnected:boolean;registerUser:(userId:string)=>void}
const SocketContext=createContext<SocketContextType|undefined>(undefined);
export function SocketProvider({children}:{children:ReactNode}){const [socket,setSocket]=useState<Socket|null>(null);const [isConnected,setIsConnected]=useState(false);const {user}=useAuth();
useEffect(()=>{const s=io(API_ORIGIN,{transports:['websocket','polling'],autoConnect:true,reconnection:true,reconnectionAttempts:5,reconnectionDelay:1000});s.on('connect',()=>setIsConnected(true));s.on('disconnect',()=>setIsConnected(false));s.on('connect_error',()=>setIsConnected(false));setSocket(s);return()=>s.disconnect()},[]);
const registerUser=useCallback((id:string)=>{if(socket&&isConnected&&id)socket.emit('register',id)},[socket,isConnected]);
useEffect(()=>{if(user?.id&&socket&&isConnected)registerUser(user.id)},[user?.id,socket,isConnected,registerUser]);
return <SocketContext.Provider value={{socket,isConnected,registerUser}}>{children}</SocketContext.Provider>}
export function useSocket(){const c=useContext(SocketContext);if(!c)throw new Error('useSocket must be within SocketProvider');return c}