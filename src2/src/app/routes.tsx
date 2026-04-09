import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/student-profile/Layout";
import { ProfileOverview } from "./components/student-profile/ProfileOverview";
import { Subjects } from "./components/student-profile/Subjects";
import { Rewards } from "./components/student-profile/Rewards";
import { Progress } from "./components/student-profile/Progress";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: ProfileOverview },
      { path: "materias", Component: Subjects },
      { path: "recompensas", Component: Rewards },
      { path: "progreso", Component: Progress },
    ],
  },
]);