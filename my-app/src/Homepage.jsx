import Login from "./assets/components/Homepage/Login"
import Welcomepage from "./assets/components/Homepage/Welcomepage"

export default function Homepage({onLogin}){

    return(
        <>
            <Welcomepage  onLogin={onLogin}/>
        </>
    )
}