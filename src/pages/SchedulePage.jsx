import SchedulePageView from "../features/schedule/SchedulePageView";
import useSchedulePage from "../features/schedule/useSchedulePage";

export default function SchedulePage() {
  const schedulePage = useSchedulePage();
  return <SchedulePageView schedulePage={schedulePage} />;
}
