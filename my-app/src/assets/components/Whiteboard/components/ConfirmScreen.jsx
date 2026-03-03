import { confirmDialog } from 'primereact/confirmdialog';
import { Button } from 'primereact/button';


export default function ConfirmScreen({ lable, header, message, onConfirm }) {

    const confirm1 = (e) => {
        e.stopPropagation();
        confirmDialog({
            message: message,
            header: header,
            defaultFocus: 'accept',
            accept: onConfirm,
            baseZIndex:9999,
            draggable:false,
            acceptClassName:"px-4 py-2 rounded mx-2",
            rejectClassName:"px-4 py-2 rounded",
            contentClassName:"m-0",
            acceptIcon:"pi pi-check",
            rejectIcon:"pi pi-times"
        });
    };

    return (
        <>
            <Button onClick={(e)=>confirm1(e)} label={lable} className="rounded-pill px-3 py-1 btn btn-dark"/>
        </>
    )
}
