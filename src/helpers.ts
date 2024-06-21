import { exec } from 'child_process';

interface Author {
  email: string;
  id: string;
  login: string;
  name: string;
}

interface Commit {
  authoredDate: string;
  authors: Author[];
  committedDate: string;
  messageBody: string;
  messageHeadline: string;
  oid: string;
}

interface CommitsResponse {
  commits: Commit[];
}

// Function to run a GitHub CLI command
function runGHCommand(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`error: ${stderr}`);
        return;
      }
      resolve(stdout);
    });
  });
}

function findMatchingStrings(strings: string[], regex: RegExp): string[] {
  // Use flatMap to collect all matches from all strings
  return strings.flatMap((str) => {
    const matches = str.match(regex);
    return matches ? matches : [];
  });
}

async function listCommits(prNumber: number) {
  try {
    const result = await runGHCommand(
      `gh pr view ${prNumber} --json commits` // Note there is probably some limit to how many commits this returns. But I don't know where that is documented.
    );
    const data: CommitsResponse = JSON.parse(result);
    return data.commits.map((c) => c.messageHeadline);
  } catch (error) {
    console.error('Error:', error);
  }
}

function generatePRDescription(strings: string[], matchRegex: RegExp): string {
  const matches = findMatchingStrings(strings, matchRegex);

  if (matches.length === 0) {
    return 'No MOJO references found in this pull request.';
  }

  // Join matches with comma and space
  const description = `ref ${matches.join(', ')}`;
  return description;
}

function updatePRDescription(
  currentDescription: string,
  newSection: string
): string {
  // Remove the existing "Linear Tickets Found" section
  const regex =
    /<!-- === LINEAR TICKETS FENCE START === -->[\s\S]*?<!-- === LINEAR TICKETS FENCE END === -->/gi;
  const cleanedDescription = currentDescription.replace(regex, '');
  // Concatenate cleaned description with new section
  const updatedDescription =
    cleanedDescription.trim() + '\n\n' + newSection.trim();

  return updatedDescription.trim();
}

export { updatePRDescription, generatePRDescription, listCommits };