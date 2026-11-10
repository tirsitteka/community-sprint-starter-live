// =============================================================
// YOUR TEAM AND PROJECT: fill this in first!
// The web page AND the AI agent both read this file, so the app
// introduces your team and the agent knows what problem it serves.
// Anything still starting with "TODO" shows up highlighted on the page.
// =============================================================


export const project = {
  teamName: 'AI Advocacy - Letter Decoder',
  appName: 'Benefits Letter Decoder',
  tagline: 'Understand your benefits letters and know what to do next.',

  // One or two sentences. Who is hurting, and how?
  problemStatement:
    'Older adults often receive complicated Medicaid and SNAP letters that are difficult to understand. They may miss important deadlines or fail to take required actions, putting their benefits at risk.',

  // One specific person. Give them a name, an age, and a situation.
  targetUser:
    'TODO: Create a fictional persona representing an adult age 65+ on a fixed income who receives Medicaid or SNAP notices.',

  community: 'TODO: Confirm the state with the team',
  theme: 'Access to Essential Services / Senior Advocacy',

  // How you will know it works. Make it measurable.
  successMeasure:
    'At least 90% accuracy on 15 sample notices and at least 80% of test users correctly identify the deadline and required action.',

  teamMembers: [
    { name: 'TODO', role: 'Product owner (writes tickets)' },
    { name: 'TODO', role: 'Front end (React)' },
    { name: 'TODO', role: 'Back end (API + database)' },
    { name: 'TODO', role: 'AI agent and skills' },
  ],

  // The personality of your AI agent. Used in its system prompt.
  agent: {
    name: 'Benefits Letter Decoder',
    voice: 'calm, respectful, clear, and easy to understand',
    readingLevel: '6th grade',
  },
};
  

// True if a value still needs to be filled in.
export const isTodo = (value) => typeof value === 'string' && value.trim().startsWith('TODO');
