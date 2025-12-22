import Login from "./assets/components/Homepage/Login"
import ImgCarousel from "./assets/components/Homepage/ImgCarousel"

export default function Homepage({onLogin}){

    return(
        <>
            <ImgCarousel/>
            <Login onLogin={onLogin}/>
        </>
    )
}