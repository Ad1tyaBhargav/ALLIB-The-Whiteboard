import useImage from "use-image";
import { useState } from "react";
import { Image } from "react-konva";

export default function ImgElement({ el, selectedId, setSelectedId }) {
    const [img] = useImage(el.src);

    return (
        <Image
            id={el.id}
            image={img}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            draggable={selectedId === el.id}
            onDblClick={() => setSelectedId(el.id)}
            onTap={() => setSelectedId(el.id)}
        />
    );
}