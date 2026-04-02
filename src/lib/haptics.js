export const hapticLight = () => navigator.vibrate?.(10)
export const hapticMedium = () => navigator.vibrate?.(25)
export const hapticSuccess = () => navigator.vibrate?.([10, 50, 10])
