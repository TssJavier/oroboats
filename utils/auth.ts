interface User {
  id: string
  name: string
  email: string
}

export const setUser = (user: User | null) => {
  console.log("Setting user:", user)
}
