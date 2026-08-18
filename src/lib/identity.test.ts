import { describe, expect, it } from 'vitest'
import {
  AVATAR_COLORS,
  ageFrom,
  colorFor,
  fullName,
  hashPassword,
  initialsOf,
  isEmail,
  makeInviteCode,
  normalizeEmail,
} from './identity'

describe('colorFor', () => {
  it('donne toujours la meme couleur au meme identifiant', () => {
    expect(colorFor('a123')).toBe(colorFor('a123'))
  })

  it('reste dans la palette', () => {
    for (const seed of ['a', 'bb', 'ccc', 'compte-tres-long-quand-meme']) {
      expect(AVATAR_COLORS).toContain(colorFor(seed))
    }
  })
})

describe('initialsOf', () => {
  it('prend la premiere lettre du prenom et du nom', () => {
    expect(initialsOf('Matthew', 'Ejaz')).toBe('ME')
  })

  it('se contente du prenom quand le nom manque', () => {
    expect(initialsOf('Lola', '')).toBe('L')
  })

  it('affiche un point d interrogation quand on ne sait rien', () => {
    expect(initialsOf('', '')).toBe('?')
  })
})

describe('fullName', () => {
  it('assemble prenom et nom', () => {
    expect(fullName('Said', 'Benali')).toBe('Said Benali')
  })

  it('n ajoute pas d espace en trop quand le nom manque', () => {
    expect(fullName('Victor', '')).toBe('Victor')
  })

  it('ignore les espaces autour', () => {
    expect(fullName('  Jack  ', '  Dupont ')).toBe('Jack Dupont')
  })
})

describe('normalizeEmail', () => {
  it('met en minuscules et enleve les espaces', () => {
    expect(normalizeEmail('  Ismael@Demo.FR ')).toBe('ismael@demo.fr')
  })

  it('rend deux saisies equivalentes comparables', () => {
    expect(normalizeEmail('LOLA@demo.fr')).toBe(normalizeEmail('lola@DEMO.fr'))
  })
})

describe('isEmail', () => {
  it('accepte une adresse ordinaire', () => {
    expect(isEmail('kejian@demo.fr')).toBe(true)
  })

  it('refuse une adresse sans arobase ni domaine', () => {
    expect(isEmail('kejian')).toBe(false)
    expect(isEmail('kejian@demo')).toBe(false)
  })

  it('refuse une chaine vide ou faite d espaces', () => {
    expect(isEmail('')).toBe(false)
    expect(isEmail('   ')).toBe(false)
  })
})

describe('makeInviteCode', () => {
  it('fait six caracteres', () => {
    expect(makeInviteCode()).toHaveLength(6)
  })

  it('evite les caracteres qu on confond a l oral ou a l ecrit', () => {
    // Ni O/0, ni I/1 : un code doit pouvoir se dicter au telephone.
    for (let i = 0; i < 200; i += 1) {
      expect(makeInviteCode()).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
    }
  })

  it('ne rend pas sans cesse le meme code', () => {
    const codes = new Set(Array.from({ length: 50 }, () => makeInviteCode()))
    expect(codes.size).toBeGreaterThan(40)
  })
})

describe('ageFrom', () => {
  it('ne repond rien quand la date est absente ou illisible', () => {
    expect(ageFrom('')).toBeNull()
    expect(ageFrom('pas-une-date')).toBeNull()
  })

  it('calcule un age plausible', () => {
    const naissance = new Date()
    naissance.setFullYear(naissance.getFullYear() - 30)
    expect(ageFrom(naissance.toISOString().slice(0, 10))).toBe(30)
  })

  it('ne compte pas l annee tant que l anniversaire n est pas passe', () => {
    const demain = new Date()
    demain.setDate(demain.getDate() + 1)
    demain.setFullYear(demain.getFullYear() - 25)
    expect(ageFrom(demain.toISOString().slice(0, 10))).toBe(24)
  })

  it('compte l annee une fois l anniversaire passe', () => {
    const hier = new Date()
    hier.setDate(hier.getDate() - 1)
    hier.setFullYear(hier.getFullYear() - 25)
    expect(ageFrom(hier.toISOString().slice(0, 10))).toBe(25)
  })
})

describe('hashPassword', () => {
  it('rend toujours la meme empreinte pour le meme mot de passe', async () => {
    expect(await hashPassword('verdon2026')).toBe(await hashPassword('verdon2026'))
  })

  it('ne laisse jamais transparaitre le mot de passe', async () => {
    const empreinte = await hashPassword('verdon2026')
    expect(empreinte).not.toContain('verdon2026')
    expect(empreinte).toMatch(/^[0-9a-f]{64}$/)
  })

  it('distingue deux mots de passe differents', async () => {
    expect(await hashPassword('verdon2026')).not.toBe(await hashPassword('verdon2027'))
  })
})
