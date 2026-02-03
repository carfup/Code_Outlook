//import { initialize } from "@microsoft/power-apps/app";
import { createContext, useContext, useEffect,  type ReactNode } from "react";

interface PowerContextValue {
    isInitialized: boolean;
}

const PowerContext = createContext<PowerContextValue>({ isInitialized: false });

export const usePower = () => useContext(PowerContext);

interface PowerProviderProps {
    children: ReactNode;
}

export default function PowerProvider({ children }: PowerProviderProps) {


    useEffect(() => {
       /* const init = async () => {
            await initialize();
            setIsInitialized(true);
        };
        init();*/
    }, []);

    return (
        <PowerContext.Provider value={{ isInitialized : true }}>
            {children}
        </PowerContext.Provider>
    );
}