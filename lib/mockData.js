// lib/mockData.js
// Mock data dinámico — genera datos distintos según la fecha seleccionada
export class MockDataService {
  static #EXTENSIONES  = ['4011','4012','4015','4018','4019','4021','4022','4025','4027','4029','4031','4033','4036','4041','4044'];
  static #CAMPANAS     = ['VENTAS_OUT','SOPORTE_IN','COBRANZA','RETENCION'];
  static #TIPOS        = ['local','larga_dist','celular','voip','internacional'];
  static #DESTINOS     = {
    local:         ['555-1234','555-7890','555-2233','555-4321','555-8765'],
    larga_dist:    ['800-5566','800-1234','800-9988','800-3344'],
    celular:       ['044-5559123','044-3312456','044-9981234','044-7761234'],
    voip:          ['10.5.1.14','10.5.1.22','10.5.1.30','10.5.2.10'],
    internacional: ['+52-33-1234','+1-800-1234','+34-91-1234','+52-55-5678'],
  };
  static #DURACIONES   = { local:[60,420], larga_dist:[120,600], celular:[30,540], voip:[60,900], internacional:[60,480] };
  static #TARIFAS_MOCK = { local:0.012, larga_dist:0.045, celular:0.035, voip:0.008, internacional:0.120 };

  static #seed(fecha) {
    let h = 0;
    for (let i = 0; i < fecha.length; i++) {
      h = Math.imul(31, h) + fecha.charCodeAt(i) | 0;
    }
    return Math.abs(h);
  }

  static #rng(s) {
    let x = s;
    return () => {
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
      x ^= x >>> 16;
      return (x >>> 0) / 0xffffffff;
    };
  }

  static kpis(fecha) {
    const r    = this.#rng(this.#seed(fecha));
    const base = 900 + Math.round(r() * 600);
    const seg  = base * (150 + Math.round(r() * 120));
    const drop = Math.round(base * (0.04 + r() * 0.08));
    return {
      totalLlamadas:    base,
      costoTotal:       parseFloat((seg / 60 * 0.025).toFixed(2)),
      ahtSeg:           Math.round(seg / base),
      llamadasPerdidas: drop,
      dropRate:         parseFloat(((drop / base) * 100).toFixed(1)),
    };
  }

  static llamadas(fecha, limit = 50) {
    const r = this.#rng(this.#seed(fecha) + 1);
    const rows = Array.from({ length: limit }, () => {
      const h    = 8 + Math.floor(r() * 11);
      const m    = Math.floor(r() * 60);
      const tipo = this.#TIPOS[Math.floor(r() * this.#TIPOS.length)];
      const [dMin, dMax] = this.#DURACIONES[tipo];
      const durSeg  = dMin + Math.floor(r() * (dMax - dMin));
      const tarifa  = this.#TARIFAS_MOCK[tipo];
      const fhMult  = h < 8 || h >= 20 ? 1.20 : 1;
      const costo   = parseFloat(((durSeg / 60) * tarifa * fhMult).toFixed(3));
      const destArr = this.#DESTINOS[tipo];
      return {
        hora:      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,
        extension: this.#EXTENSIONES[Math.floor(r() * this.#EXTENSIONES.length)],
        destino:   destArr[Math.floor(r() * destArr.length)],
        tipo,
        duracion:  `${Math.floor(durSeg/60)}:${String(durSeg%60).padStart(2,'0')}`,
        costo:     `$${costo}`,
        estado:    r() < 0.08 ? 'drop' : 'ok',
        campana:   this.#CAMPANAS[Math.floor(r() * this.#CAMPANAS.length)],
        direccion: r() < 0.45 ? 'INBOUND' : 'OUTBOUND',
      };
    });
    return rows.sort((a, b) => b.hora.localeCompare(a.hora));
  }

  static porHora(fecha) {
    const r = this.#rng(this.#seed(fecha) + 2);
    const curva = [0.4, 0.65, 0.85, 1.0, 0.75, 0.7, 0.9, 0.95, 0.8, 0.65, 0.45];
    return curva.map((factor, i) => {
      const hora  = 8 + i;
      const total = Math.round((80 + r() * 80) * factor);
      const seg   = total * (150 + Math.round(r() * 120));
      return {
        hora:  `${String(hora).padStart(2,'0')}:00`,
        total,
        costo: parseFloat((seg / 60 * 0.025).toFixed(2)),
        drops: Math.round(total * (0.03 + r() * 0.07)),
      };
    });
  }

  static porCampana(fecha) {
    const r = this.#rng(this.#seed(fecha) + 3);
    return this.#CAMPANAS.map(campana => {
      const total = 200 + Math.round(r() * 300);
      const seg   = total * (140 + Math.round(r() * 100));
      return { campana, total, costo: parseFloat((seg / 60 * 0.025).toFixed(2)) };
    }).sort((a, b) => b.costo - a.costo);
  }

  static isDbConnectionError(err) {
    return ['ECONNREFUSED','EHOSTDOWN','ETIMEDOUT','ENOTFOUND','ECONNRESET'].includes(err.code);
  }
}
