# CI Fix Coach – Mini Test Suite (v1)

## Test 1 – Lint failure (ESLint / Prettier)

### Input log

/ci-fix-coach
Run npm run lint
> eslint src --ext .ts,.tsx

src/components/Button.tsx
  10:3  error  Expected indentation of 2 spaces but found 4  indent
  15:1  error  Delete `··`                           prettier/prettier

✖ 2 problems (2 errors, 0 warnings)
Error: Process completed with exit code 1.

### Expected answer (περιγραφή, όχι 1:1 κείμενο)

Α.
- Να λέει ότι απέτυχε ο lint/formatter στον κώδικα TypeScript/React.

Β.
- Να λέει ότι το format/indentation δεν ακολουθεί τους κανόνες eslint/prettier.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ανοίξεις το αρχείο `src/components/Button.tsx`,
  2) να τρέξεις τον formatter (π.χ. `npm run format` ή format από το IDE),
  3) να διορθώσεις τα σημεία που δείχνει το log,
  4) να κάνεις commit και να ξαναστείλεις το PR.

Δ. Τοπικός έλεγχος:
- Κάποια εντολή τύπου `npm run lint`.

Ε. Αρχείο/αλλαγή:
- `src/components/Button.tsx` – να λέει ότι διορθώνεις μόνο format/indent, όχι λογική.


## Test 2 – Dependency missing (module not found – axios)

### Input log

/ci-fix-coach
Run npm ci

added 1247 packages in 32s

Run npm run build
> tsc && vite build

src/services/api.ts:21:21 - error TS2307: Cannot find module 'axios' or its corresponding type declarations.

21 import axios from 'axios';
                       ~~~~~

Found 1 error.
Error: Process completed with exit code 2.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε το build (TypeScript build).

Β.
- Να λέει ότι το module `axios` δεν βρέθηκε επειδή λείπει από τα dependencies ή δεν είναι εγκατεστημένο.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ελέγξεις το `package.json`,
  2) να εγκαταστήσεις `axios` (π.χ. `npm install axios`),
  3) να κάνεις commit `package.json` και `package-lock.json`,
  4) να ξαναστείλεις το PR.

Δ. Τοπικός έλεγχος:
- Κάτι σαν `npm install` + `npm run build`.

Ε. Αρχείο/αλλαγή:
- `package.json` – να προσθέσεις `axios` στα dependencies.


## Test 3 – Permission error (git push from CI)

### Input log

/ci-fix-coach
Run git push origin HEAD:main
ERROR: Permission to myorg/myrepo.git denied to ci-bot.
fatal: unable to access 'https://github.com/myorg/myrepo.git/': The requested URL returned error: 403
Error: Process completed with exit code 1.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε το git push στο CI pipeline λόγω permission denied.

Β.
- Να εξηγεί ότι ο χρήστης/το token του CI δεν έχει write access ή τα σωστά δικαιώματα στο repo.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ελέγξεις τα repo settings/permissions για τον ci-bot ή το token,
  2) να βεβαιωθείς ότι το CI token έχει scope `repo` ή `contents: write`,
  3) να ενημερώσεις το secret στο CI αν χρειάζεται,
  4) να ξανατρέξεις το pipeline.

Δ. Τοπικός έλεγχος:
- Προαιρετικά κάποιο `gh auth status` ή δοκιμαστικό `git push` με το ίδιο token.

Ε. Αρχείο/αλλαγή:
- `.github/workflows/<workflow>.yml` – αν χρειάζεται, προσθήκη `permissions: contents: write`.


## Test 4 – Timeout / flaky Jest test

### Input log

/ci-fix-coach
Run npm test
> jest --ci

Test suite failed to run

Timeout - Async callback was not invoked within the 5000 ms timeout specified by jest.setTimeout.

at src/services/api.test.ts:15:5

Test Suites: 1 failed, 8 passed, 9 total
Tests:       1 failed, 0 skipped, 8 passed, 9 total
Snapshots:   0 total
Time:        35.123 s
Ran all test suites.
Error: Process completed with exit code 1.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε ένα test suite λόγω timeout.

Β.
- Να εξηγεί ότι ένα async callback δεν ολοκληρώθηκε μέσα στο timeout, πιθανόν επειδή περιμένει πραγματικό HTTP/API call ή λείπει σωστό async/await/done.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ανοίξεις `src/services/api.test.ts` στη γραμμή 15,
  2) να ελέγξεις αν το test χρησιμοποιεί πραγματικό HTTP call και να το κάνεις mock,
  3) να βεβαιωθείς ότι το async test ολοκληρώνεται (await/return/done),
  4) να τρέξεις ξανά τα tests τοπικά,
  5) να κάνεις commit και να ξαναστείλεις το PR.

Δ. Τοπικός έλεγχος:
- Κάτι σαν `npx jest src/services/api.test.ts --verbose`.

Ε. Αρχείο/αλλαγή:
- `src/services/api.test.ts` – να αναφέρει μικρή αλλαγή: προσθήκη mock ή σωστό async handling.


## Test 5 – Docker build: No space left on device

### Input log

/ci-fix-coach
#15 120.3 writing image sha256:abcd1234...
#15 121.0 error: failed to copy: write /var/lib/docker/overlay2/...: no space left on device
------
 > exporting to image:
------
Docker build failed: no space left on device
Error: Process completed with exit code 1.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε το Docker build επειδή δεν υπάρχει αρκετός χώρος στο δίσκο του CI runner.

Β.
- Να εξηγεί ότι ο δίσκος γέμισε (Docker layers, cache, artifacts).

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να καθαρίζεις Docker cache/temporary αρχεία στο τέλος του job,
  2) να μειώσεις τα artifacts που κρατά το pipeline,
  3) να χρησιμοποιήσεις πιο μικρά base images (π.χ. alpine) αν γίνεται.

Δ. Τοπικός έλεγχος:
- Εντολές τύπου: `docker system df` ή `docker system prune` (προσεκτικά, σε dev περιβάλλον).

Ε. Αρχείο/αλλαγή:
- CI config (π.χ. `.github/workflows/ci.yml`) – προσθήκη βήματος cleanup ή μείωση artifacts.


## Test 6 – Docker build: binary not found (npm)

### Input log

/ci-fix-coach
#7 4.123 Step 5/8 : RUN npm install
#7 4.124 /bin/sh: 1: npm: not found
------
 > [5/8] RUN npm install:
------
Error: Process completed with exit code 127.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε το Docker build γιατί δεν βρέθηκε η εντολή `npm` μέσα στην εικόνα.

Β.
- Να εξηγεί ότι το base image δεν έχει εγκατεστημένο Node.js/npm ή χρησιμοποιείται λάθος base image.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ελέγξεις το `FROM` στο Dockerfile,
  2) να διαλέξεις base image που έχει ήδη Node/npm (π.χ. `node:18-alpine`),
  3) ή να προσθέσεις `RUN` εντολή που εγκαθιστά Node/npm πριν το `npm install`.

Δ. Τοπικός έλεγχος:
- `docker build .` με το ίδιο Dockerfile.

Ε. Αρχείο/αλλαγή:
- `Dockerfile` – αλλαγή `FROM` ή προσθήκη `RUN` για εγκατάσταση Node/npm.


## Test 7 – CI config error (YAML invalid)

### Input log

/ci-fix-coach
/workflows/ci.yml (Line: 12, Col: 7): Unrecognized named-value: 'steps'. Located at position 1 within expression: steps.test.outputs.result
Error: .github/workflows/ci.yml (Line: 12, Col: 7): Unrecognized named-value: 'steps'

### Expected answer (περιγραφή)

Α.
- Να λέει ότι η ρύθμιση του CI (YAML workflow) είναι άκυρη.

Β.
- Να εξηγεί ότι χρησιμοποιείται λάθος expression/indentation ή λάθος όνομα (π.χ. `steps` σε λάθος σημείο).

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να ανοίξεις το `.github/workflows/ci.yml` στη συγκεκριμένη γραμμή,
  2) να συγκρίνεις το block με παράδειγμα από την τεκμηρίωση GitHub Actions,
  3) να διορθώσεις το expression ή το indent (π.χ. να χρησιμοποιήσεις `needs.<job_id>.outputs...` αντί για `steps...`).

Δ. Τοπικός έλεγχος:
- Να τρέξεις YAML linter ή να χρησιμοποιήσεις validator (ή απλά να ξανατρέξεις το workflow μετά τη διόρθωση).

Ε. Αρχείο/αλλαγή:
- `.github/workflows/ci.yml` – μικρή διόρθωση στο συγκεκριμένο block/γραμμή.


## Test 8 – Missing env variable (DATABASE_URL)

### Input log


/ci-fix-coach
Run npm run migrate
> prisma migrate deploy

Error: P1012: Environment variable not found: DATABASE_URL.
error Command failed with exit code 1.
Error: Process completed with exit code 1.

### Expected answer (περιγραφή)

Α.
- Να λέει ότι απέτυχε ένα βήμα (migration) επειδή λείπει η env variable `DATABASE_URL`.

Β.
- Να εξηγεί ότι η μεταβλητή περιβάλλοντος δεν είναι ορισμένη στο CI ή δεν περνάει σωστά στο job.

Γ. Τι κάνεις τώρα:
- Να προτείνει:
  1) να προσθέσεις τη `DATABASE_URL` στα secrets/variables του CI (repo ή project settings),
  2) να βεβαιωθείς ότι το workflow τη διαβάζει σωστά (π.χ. `env: DATABASE_URL: ${{ secrets.DATABASE_URL }}`),
  3) να ξανατρέξεις το pipeline.

Δ. Τοπικός έλεγχος:
- Να ορίσεις `DATABASE_URL=...` τοπικά και να τρέξεις `npm run migrate`.

Ε. Αρχείο/αλλαγή:
- CI config (`.github/workflows/ci.yml` ή αντίστοιχο) – προσθήκη της env variable από secrets.

<!-- test ci-fix-coach workflow -->