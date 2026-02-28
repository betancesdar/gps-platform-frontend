'use client';

import React from 'react';
import { WaypointsRouteBuilder } from './WaypointsRouteBuilder';

interface RouteFormProps {
    onSubmit?: (data: any) => void;
    onCancel: () => void;
    onAddressRouteCreated?: (routeId: string) => void;
    initialData?: any;
    isLoading?: boolean;
}

export const RouteForm: React.FC<RouteFormProps> = ({
    onCancel,
    onAddressRouteCreated,
}) => {
    return (
        <WaypointsRouteBuilder
            onRouteCreated={(routeId) => {
                if (onAddressRouteCreated) {
                    onAddressRouteCreated(routeId);
                }
            }}
            onCancel={onCancel}
        />
    );
};
