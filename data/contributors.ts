export interface Contributor {
  name: string
  role: string
  github?: string        // Optional: GitHub username
  contributions?: string[] // Optional: List of specific contributions
}

export const CONTRIBUTORS: Contributor[] = [
  {
    name: 'Andreas Bogossian',
    role: 'Developer'
  },
  {
    name: 'Tomi Lahti',
    role: 'Developer'
  },
]