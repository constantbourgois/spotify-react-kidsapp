export default function Button(props) {
    return (
        <div style={{ cursor: 'pointer' }} onClick={() => { props.openPlayer(props.mood); }}>{props.children}</div>
    )
}