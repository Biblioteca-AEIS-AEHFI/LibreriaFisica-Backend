export function numberToOrdinal(num: number) {
  if (typeof num !== "number" || num < 1 || num > 30) {
    return "Número fuera de rango o inválido";
  }

  const ordinales: any = {
    1: "1ra",
    2: "2da",
    3: "3ra",
    4: "4ta",
    5: "5ta",
    6: "6ta",
    7: "7ma",
    8: "8va",
    9: "9na",
    10: "10ma",
    11: "11va",
    12: "12va",
    13: "13ra",
    14: "14ta",
    15: "15ta",
    16: "16ta",
    17: "17ma",
    18: "18va",
    19: "19na",
    20: "20ma",
    21: "21ra",
    22: "22da",
    23: "23ra",
    24: "24ta",
    25: "25ta",
    26: "26ta",
    27: "27ma",
    28: "28va",
    29: "29na",
    30: "30ma",
  };

  return ordinales[num] || "Ordinal no disponible";
}
