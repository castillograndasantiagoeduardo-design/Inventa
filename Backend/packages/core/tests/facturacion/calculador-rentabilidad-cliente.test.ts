import { assertEquals } from 'jsr:@std/assert@^1';
import { CalculadorRentabilidadCliente } from '../../src/modules/facturacion/domain/services/CalculadorRentabilidadCliente.ts';

Deno.test('CalculadorRentabilidadCliente: calcula ganancia neta y rentabilidad sobre cupo aprobado', () => {
  const resultado = CalculadorRentabilidadCliente.calcular(
    {
      totalFacturado: 10_000_000,
      totalDevoluciones: 1_000_000,
      gananciaBrutaFacturas: 3_000_000,
      gananciaRevertidaDevoluciones: 500_000,
    },
    10_000_000,
  );

  assertEquals(resultado.totalFacturado, 10_000_000);
  assertEquals(resultado.totalDevoluciones, 1_000_000);
  assertEquals(resultado.gananciaGenerada, 2_500_000);
  assertEquals(resultado.rentabilidadSobreCredito, 0.25);
});

Deno.test('CalculadorRentabilidadCliente: devuelve rentabilidad null si cupo aprobado es 0', () => {
  const resultado = CalculadorRentabilidadCliente.calcular(
    {
      totalFacturado: 2_000_000,
      totalDevoluciones: 0,
      gananciaBrutaFacturas: 400_000,
      gananciaRevertidaDevoluciones: 0,
    },
    0,
  );

  assertEquals(resultado.gananciaGenerada, 400_000);
  assertEquals(resultado.rentabilidadSobreCredito, null);
});

Deno.test('CalculadorRentabilidadCliente: sin datos retorna ceros y rentabilidad null', () => {
  const resultado = CalculadorRentabilidadCliente.calcular(null, 5_000_000);

  assertEquals(resultado.totalFacturado, 0);
  assertEquals(resultado.totalDevoluciones, 0);
  assertEquals(resultado.gananciaGenerada, 0);
  assertEquals(resultado.rentabilidadSobreCredito, null);
});
