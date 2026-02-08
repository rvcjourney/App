import { createStackNavigator } from "@react-navigation/stack";
import AdminDashboard from './Admin/AdminDashboard';
import StudentCheckout from './Student/StudentCheckout';
import TeacherEarnings from './Teacher/TeacherEarnings';
import WithdrawalRequest from './Teacher/WithdrawalRequest';

const Stack = createStackNavigator();

export default function AdminStack() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            <Stack.Screen name="StudentCheckout" component={StudentCheckout} />
            <Stack.Screen name="TeacherEarnings" component={TeacherEarnings} />
            <Stack.Screen name="WithdrawalRequest" component={WithdrawalRequest} />

        </Stack.Navigator>
    );
}
