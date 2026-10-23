import { ClipLoader, FadeLoader } from 'react-spinners'

const Loader = ({ size = 48, fullScreen = true }) => {
    return (
        <div className={fullScreen ? 'loader loader-fullscreen' : 'loader loader-inline'}>
            <FadeLoader
                color="#17332a"
                height={size}
                width={size / 8}
                radius={2}
                margin={2}
            />
        </div>
    )
}

export const ActionLoader = ({ size = 20, color = '#9e9e9e' }) => (
    <span
        role="status"
        aria-label="Loading"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, flexShrink: 0 }}
    >
        <ClipLoader color={color} size={size} />
    </span>
)

export default Loader
