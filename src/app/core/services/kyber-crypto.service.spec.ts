import { TestBed } from '@angular/core/testing';
import { KyberCryptoService } from './kyber-crypto.service';
import {
  Poly,
  KYBER_512_PARAMS,
  mod,
  cbd,
  computePolyStatistics,
} from '../models/kyber.types';

describe('KyberCryptoService — Integration', () => {
  let service: KyberCryptoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KyberCryptoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('generateKeys should populate A, s, e, t with correct dimensions', async () => {
    await service.generateKeys();
    const { A, s, e, t } = service.currentState;
    const { K } = KYBER_512_PARAMS;

    expect(A.length).toBe(K);
    expect(A[0].length).toBe(K);
    expect(s.length).toBe(K);
    expect(e.length).toBe(K);
    expect(t.length).toBe(K);
  });

  it('generateKeys should produce secret s with small coefficients (CBD η₁=3)', async () => {
    await service.generateKeys();
    const { s } = service.currentState;
    const { Q } = KYBER_512_PARAMS;

    for (const poly of s) {
      for (const coeff of poly.coeffs) {
        const centered = coeff > Q / 2 ? coeff - Q : coeff;
        expect(Math.abs(centered)).toBeLessThanOrEqual(3);
      }
    }
  });

  it('encrypt bit 0 then decrypt should return 0', async () => {
    await service.generateKeys();
    await service.encrypt(0);
    const result = await service.decrypt();
    expect(result).toBe(0);
  });

  it('encrypt bit 1 then decrypt should return 1', async () => {
    await service.generateKeys();
    await service.encrypt(1);
    const result = await service.decrypt();
    expect(result).toBe(1);
  });

  it('encrypt should throw on invalid bit value', async () => {
    await service.generateKeys();
    await expectAsync(service.encrypt(2 as 0 | 1)).toBeRejected();
  });

  it('decrypt should throw when no ciphertext exists', async () => {
    await expectAsync(service.decrypt()).toBeRejected();
  });

  it('hasKeys returns false before generateKeys', () => {
    expect(service.hasKeys()).toBeFalse();
  });

  it('hasKeys returns true after generateKeys', async () => {
    await service.generateKeys();
    expect(service.hasKeys()).toBeTrue();
  });

  it('hasCiphertext returns false before encrypt', async () => {
    await service.generateKeys();
    expect(service.hasCiphertext()).toBeFalse();
  });

  it('hasCiphertext returns true after encrypt', async () => {
    await service.generateKeys();
    await service.encrypt(1);
    expect(service.hasCiphertext()).toBeTrue();
  });

  it('reset clears state', async () => {
    await service.generateKeys();
    service.reset();
    expect(service.hasKeys()).toBeFalse();
    expect(service.hasCiphertext()).toBeFalse();
  });

  it('encrypt/decrypt roundtrip succeeds consistently over many trials', async () => {
    let failures = 0;
    const trials = 20;

    for (let i = 0; i < trials; i++) {
      service.reset();
      await service.generateKeys();
      const bit = (i % 2) as 0 | 1;
      await service.encrypt(bit);
      const result = await service.decrypt();
      if (result !== bit) failures++;
    }

    expect(failures).toBe(0, `${failures}/${trials} decryption failures`);
  });
});

describe('Poly class', () => {
  const { N, Q } = KYBER_512_PARAMS;

  it('constructor pads to length N', () => {
    const p = new Poly([1, 2, 3]);
    expect(p.coeffs.length).toBe(N);
    expect(p.coeffs[0]).toBe(1);
    expect(p.coeffs[3]).toBe(0);
  });

  it('add is commutative', () => {
    const a = Poly.random();
    const b = Poly.random();
    const ab = a.add(b);
    const ba = b.add(a);
    for (let i = 0; i < N; i++) {
      expect(ab.coeffs[i]).toBe(ba.coeffs[i]);
    }
  });

  it('add keeps coefficients in [0, Q)', () => {
    const a = Poly.random();
    const b = Poly.random();
    const result = a.add(b);
    for (const c of result.coeffs) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(Q);
    }
  });

  it('sub(self) produces zero polynomial', () => {
    const a = Poly.random();
    const zero = a.sub(a);
    for (const c of zero.coeffs) {
      expect(c).toBe(0);
    }
  });

  it('mul keeps coefficients in [0, Q)', () => {
    const a = Poly.random();
    const b = Poly.random();
    const result = a.mul(b);
    for (const c of result.coeffs) {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(Q);
    }
  });

  it('noise(ETA1) coefficients are in [-ETA1, ETA1] after center reduction', () => {
    const poly = Poly.noise(KYBER_512_PARAMS.ETA1);
    for (const coeff of poly.coeffs) {
      const centered = coeff > Q / 2 ? coeff - Q : coeff;
      expect(Math.abs(centered)).toBeLessThanOrEqual(KYBER_512_PARAMS.ETA1);
    }
  });

  it('noise(ETA2) coefficients are in [-ETA2, ETA2] after center reduction', () => {
    const poly = Poly.noise(KYBER_512_PARAMS.ETA2);
    for (const coeff of poly.coeffs) {
      const centered = coeff > Q / 2 ? coeff - Q : coeff;
      expect(Math.abs(centered)).toBeLessThanOrEqual(KYBER_512_PARAMS.ETA2);
    }
  });
});

describe('mod utility', () => {
  it('returns positive result for negative input', () => {
    expect(mod(-1, 3329)).toBe(3328);
    expect(mod(-3329, 3329)).toBe(0);
  });

  it('returns value in [0, m)', () => {
    for (let n = -10; n <= 10; n++) {
      const result = mod(n, 7);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThan(7);
    }
  });
});

describe('cbd utility', () => {
  it('samples within [-eta, eta]', () => {
    for (let eta = 2; eta <= 3; eta++) {
      for (let i = 0; i < 1000; i++) {
        const sample = cbd(eta);
        expect(Math.abs(sample)).toBeLessThanOrEqual(eta);
      }
    }
  });

  it('distribution is approximately centered around 0', () => {
    const samples = Array.from({length: 10000}, () => cbd(2));
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    expect(Math.abs(mean)).toBeLessThan(0.1);
  });
});

describe('computePolyStatistics', () => {
  it('returns correct mean for constant polynomial', () => {
    const poly = new Poly(new Array(256).fill(100));
    const stats = computePolyStatistics(poly);
    expect(stats.mean).toBeCloseTo(100, 5);
    expect(stats.stdDev).toBeCloseTo(0, 5);
    expect(stats.max).toBe(100);
    expect(stats.min).toBe(100);
  });
});
