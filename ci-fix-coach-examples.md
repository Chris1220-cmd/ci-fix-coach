# CI Fix Coach - Test Examples

Παρακάτω υπάρχουν 8 παραδείγματα. Για κάθε ένα δίνεται ένα μικρό CI log και η αναμενόμενη απάντηση του CI Fix Coach. Χρησιμοποίησέ τα για να ελέγξεις ότι το skill τηρεί πάντα το format Α–Ε.

---

## Παράδειγμα 1 – Lint / Format failure (ESLint)

### CI Log
```
Run npm run lint
> eslint src/

/home/runner/work/app/src/components/Header.tsx
  12:5  error  Unexpected console statement  no-console
  45:1  error  Missing semicolon             semi

✖ 2 problems (2 errors, 0 warnings)

npm ERR! code ELIFECYCLE
npm ERR! errno 1
Error: Process completed with exit code 1.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε ο έλεγχος lint στο αρχείο Header.tsx.
Β. Υπάρχουν 2 παραβιάσεις κανόνων ESLint: ένα console statement και ένα missing semicolon.
Γ. Τι κάνεις τώρα:
   1) Άνοιξε το αρχείο src/components/Header.tsx.
   2) Γραμμή 12: αφαίρεσε ή αντικατέστησε το console statement.
   3) Γραμμή 45: πρόσθεσε semicolon στο τέλος της γραμμής.
   4) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: npm run lint
Ε. Αρχείο/αλλαγή: src/components/Header.tsx – γραμμή 12: αφαίρεσε console.log(), γραμμή 45: πρόσθεσε ;
```

---

## Παράδειγμα 2 – Unit test failure (Jest)

### CI Log
```
FAIL src/utils/math.test.ts
  ● add() › should return sum of two numbers

    expect(received).toBe(expected)

    Expected: 5
    Received: 4

      4 |   it('should return sum of two numbers', () => {
      5 |     expect(add(2, 3)).toBe(5);
      6 |   });

    at Object.<anonymous> (src/utils/math.test.ts:5:27)

Test Suites: 1 failed, 12 passed, 13 total
Tests:       1 failed, 45 passed, 46 total
Error: Process completed with exit code 1.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε 1 unit test στο αρχείο math.test.ts.
Β. Η συνάρτηση add(2, 3) επιστρέφει 4 αντί για 5, άρα η λογική πρόσθεσης είναι λάθος.
Γ. Τι κάνεις τώρα:
   1) Άνοιξε το αρχείο src/utils/math.ts και βρες τη συνάρτηση add().
   2) Έλεγξε αν η πράξη πρόσθεσης είναι σωστή.
   3) Διόρθωσε το bug και τρέξε τα tests τοπικά.
   4) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: npx jest src/utils/math.test.ts
Ε. Αρχείο/αλλαγή: src/utils/math.ts – έλεγξε τη συνάρτηση add(), πιθανώς χρησιμοποιεί λάθος τελεστή.
```

---

## Παράδειγμα 3 – Dependency missing / Module not found

### CI Log
```
Run npm ci
npm warn deprecated inflight@1.0.6

added 1247 packages in 32s

Run npm run build
> tsc && vite build

src/services/api.ts:2:21 - error TS2307: Cannot find module 'axios' or its corresponding type declarations.

2 import axios from 'axios';
                    ~~~~~~~

Found 1 error.
Error: Process completed with exit code 2.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε το build γιατί δεν βρέθηκε το module axios.
Β. Το πακέτο axios δεν υπάρχει στο package.json, οπότε δεν εγκαταστάθηκε στο CI.
Γ. Τι κάνεις τώρα:
   1) Τρέξε npm install axios τοπικά.
   2) Βεβαιώσου ότι το package.json και το package-lock.json ενημερώθηκαν.
   3) Κάνε commit και τα δύο αρχεία.
   4) Ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: npm install axios && npm run build
Ε. Αρχείο/αλλαγή: package.json – πρόσθεσε axios στα dependencies.
```

---

## Παράδειγμα 4 – Build failed (TypeScript compile error)

### CI Log
```
Run npm run build
> tsc --noEmit

src/components/UserCard.tsx:18:9 - error TS2322: Type 'string' is not assignable to type 'number'.

18         age={user.age}
           ~~~

  src/types/User.ts:4:3
    4   age: number;
        ~~~
    The expected type comes from property 'age'

Found 1 error in src/components/UserCard.tsx:18
Error: Process completed with exit code 2.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε το TypeScript build στο αρχείο UserCard.tsx.
Β. Το property age περνιέται ως string ενώ ο τύπος περιμένει number.
Γ. Τι κάνεις τώρα:
   1) Άνοιξε src/components/UserCard.tsx, γραμμή 18.
   2) Βρες από πού έρχεται η τιμή user.age και γιατί είναι string.
   3) Μετέτρεψέ τη σε number (π.χ. Number(user.age) ή parseInt).
   4) Τρέξε tsc τοπικά για να σιγουρευτείς.
   5) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: npx tsc --noEmit
Ε. Αρχείο/αλλαγή: src/components/UserCard.tsx:18 – μετέτρεψε user.age σε number πριν το περάσεις ως prop.
```

---

## Παράδειγμα 5 – Permission denied στο pipeline

### CI Log
```
Run docker build -t myapp .
Step 1/8 : FROM node:18-alpine
 ---> 4a67a5c5b1a2
Step 4/8 : COPY . .
 ---> Using cache
Step 6/8 : RUN npm run build
 ---> Running in a3b2c1d4e5f6
sh: 1: node_modules/.bin/vite: Permission denied
The command '/bin/sh -c npm run build' returned a non-zero code: 126
Error: Process completed with exit code 1.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε το Docker build λόγω permission denied στο vite binary.
Β. Το αρχείο node_modules/.bin/vite δεν έχει δικαιώματα εκτέλεσης μέσα στο container.
Γ. Τι κάνεις τώρα:
   1) Πρόσθεσε στο Dockerfile ένα RUN chmod +x node_modules/.bin/vite πριν το build step.
   2) Εναλλακτικά: πρόσθεσε ένα .dockerignore που εξαιρεί node_modules και κάνε npm ci μέσα στο container.
   3) Ξαναχτίσε τοπικά με docker build για να σιγουρευτείς.
   4) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: docker build -t myapp .
Ε. Αρχείο/αλλαγή: Dockerfile – πρόσθεσε RUN chmod +x node_modules/.bin/vite πριν το RUN npm run build, ή πρόσθεσε node_modules στο .dockerignore.
```

---

## Παράδειγμα 6 – Timeout

### CI Log
```
Run npm test
> jest --ci

RUNS  src/services/api.test.ts

  ● Test suite failed to run

    Timeout - Async callback was not invoked within the 5000 ms timeout specified by jest.setTimeout.

      at src/services/api.test.ts:15:5

Test Suites: 1 failed, 8 passed, 9 total
Tests:       0 of 1 total
Error: Process completed with exit code 1.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε ένα test suite λόγω timeout στο αρχείο api.test.ts.
Β. Ένα async callback δεν ολοκληρώθηκε μέσα στα 5000ms, πιθανώς περιμένει πραγματικό API call ή ξεχασμένο done().
Γ. Τι κάνεις τώρα:
   1) Άνοιξε src/services/api.test.ts, γραμμή 15.
   2) Έλεγξε αν το test κάνει πραγματικό HTTP call χωρίς mock.
   3) Πρόσθεσε mock για το API call ή κάλεσε done() στο callback.
   4) Τρέξε τα tests τοπικά.
   5) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: npx jest src/services/api.test.ts --verbose
Ε. Αρχείο/αλλαγή: src/services/api.test.ts:15 – πρόσθεσε mock ή κάλεσε done() στο async test.
```

---

## Παράδειγμα 7 – Python lint failure (flake8)

### CI Log
```
Run flake8 src/
src/handlers/auth.py:23:80: E501 line too long (112 > 79 characters)
src/handlers/auth.py:41:1: W291 trailing whitespace
src/handlers/auth.py:42:1: W293 whitespace before ':'
3     E501 line too long (112 > 79 characters)
1     W291 trailing whitespace
1     W293 whitespace before ':'
Error: Process completed with exit code 1.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχε ο έλεγχος flake8 στο αρχείο auth.py.
Β. Υπάρχουν 3 παραβιάσεις: μία μεγάλη γραμμή και 2 θέματα whitespace.
Γ. Τι κάνεις τώρα:
   1) Άνοιξε src/handlers/auth.py.
   2) Γραμμή 23: σπάσε τη γραμμή ώστε να μην ξεπερνάει τους 79 χαρακτήρες.
   3) Γραμμές 41–42: αφαίρεσε τα trailing whitespace.
   4) Τρέξε τον formatter τοπικά.
   5) Κάνε commit και ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: flake8 src/handlers/auth.py
Ε. Αρχείο/αλλαγή: src/handlers/auth.py – γραμμή 23: σπάσε σε πολλές γραμμές, γραμμές 41-42: αφαίρεσε κενά.
```

---

## Παράδειγμα 8 – Dependency missing (Python / pip)

### CI Log
```
Run pip install -r requirements.txt
Collecting flask==2.3.2
  Downloading Flask-2.3.2-py3-none-any.whl
Collecting requests==2.31.0
  Downloading requests-2.31.0-py3-none-any.whl
Successfully installed flask-2.3.2 requests-2.31.0

Run python -m pytest
ImportError while loading conftest:
ModuleNotFoundError: No module named 'pytest_mock'
Error: Process completed with exit code 4.
```

### Αναμενόμενη απάντηση
```
Α. Απέτυχαν τα tests γιατί δεν βρέθηκε το module pytest_mock.
Β. Το πακέτο pytest-mock δεν υπάρχει στο requirements.txt, οπότε δεν εγκαταστάθηκε στο CI.
Γ. Τι κάνεις τώρα:
   1) Πρόσθεσε pytest-mock στο requirements.txt (ή σε ένα requirements-dev.txt).
   2) Τρέξε pip install -r requirements.txt τοπικά.
   3) Σιγουρέψου ότι τα tests περνάνε.
   4) Κάνε commit το ενημερωμένο requirements.txt.
   5) Ξαναστείλε το PR.
Δ. Τοπικός έλεγχος: pip install pytest-mock && python -m pytest
Ε. Αρχείο/αλλαγή: requirements.txt – πρόσθεσε γραμμή: pytest-mock
```
