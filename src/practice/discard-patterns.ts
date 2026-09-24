// Practice shapes, not an answer key. The selected rule engine recalculates
// every transformed hand and checks its difficulty before returning a problem.
// Each family is varied by suit permutations and independent rank reflections.
export const discardPatterns = {
  2: [
    "122444555899m35p",
    "468999m24445599p",
    "1244566688m1367p",
    "222355699m34688p",
    "12224456778m233p",
    "24678m123344679p",
    "12345567m125679p",
    "11245589m345678p",
    "123557m12447799p",
    "1233445789m4557p",
    "111344689m56788p",
    "12246788m124557p",
    "111224679m24779p",
    "2335677m1233555p",
    "122555666778m23p",
    "1223455578m3589p",
    "113456689m24456p",
    "124466778m24479p",
    "1267788m5556999p",
    "136799m13445788p"
],
  3: [
    "1133389m1356789p",
    "1234889m2344889p",
    "34446789m113455p",
    "122256678999m89p",
    "11333445678m355p",
    "112245666699m46p",
    "12334668m334566p",
    "3555677m1366789p",
    "112357889m13599p",
    "2223466889m4578p",
    "111223577789m23p",
    "1122345799m1245p",
    "111223467m23589p",
    "124456778m12566p",
    "1236779m1134799p",
    "135667899m23677p",
    "333557m23367899p",
    "223356678999m78p",
    "1123355667m2344p",
    "133568899m45789p"
],
} as const;
